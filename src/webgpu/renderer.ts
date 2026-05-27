import html2canvas from 'html2canvas'
import { Circle, type CircleConfig } from './circle'
import { createDefaultGlassParams, videoBackgroundUrl } from './defaults'
import { createBackgroundElement, isTemplateBackground, type BackgroundTemplateOptions } from '../templates'
import {
  detectHTMLInCanvasSupport,
  enableLayoutSubtree,
  setupPaintHandler,
  type HTMLInCanvasSupport,
} from './html-in-canvas'
import {
  clientPointToCanvasPoint,
  getClickedSplitMenuIndex,
  getShapeBounds,
  getSwitchMetrics,
  isPointInsideGlass,
  isPointInsideSplitMenu,
  isPointInsideSwitchTrack,
  resizeCanvasToDisplaySize,
} from './geometry'
import {
  createBindGroupLayout,
  createBindGroup,
  createPipeline,
} from './shader'
import { BackgroundTextureLoader } from './texture-loader'
import type { BackgroundType, GlassParams } from './types'
import { createGlassUniformData, GLASS_UNIFORM_BUFFER_SIZE } from './uniforms'

export type { BackgroundType, GlassParams } from './types'
export { Circle, type CircleConfig } from './circle'

export class WebGPURenderer {
  private device!: GPUDevice
  private context!: GPUCanvasContext
  private format!: GPUTextureFormat
  private pipeline!: GPURenderPipeline
  private bindGroup!: GPUBindGroup
  private uniformBuffer!: GPUBuffer
  private bgTexture!: GPUTexture
  private bgSampler!: GPUSampler
  private iconTexture!: GPUTexture
  private iconSampler!: GPUSampler
  private bindGroupLayout!: GPUBindGroupLayout
  private textureLoader!: BackgroundTextureLoader
  private startTime = performance.now()
  private backgroundRequestId = 0
  private iconRequestId = 0
  private glassCenterX = 0.5
  private glassCenterY = 0.5
  private gridOffset = 0
  private switchCenterX = 0.5
  private switchCenterY = 0.5
  private videoElement: HTMLVideoElement | null = null

  // Player controls circles (left, center, right)
  private _circles: Circle[] = []

  // HTML-in-Canvas support for article background
  private htmlInCanvasSupport: HTMLInCanvasSupport = { supported: false, copyElementImageToTexture: false }
  private articleElement: HTMLElement | null = null
  private articleTexture: GPUTexture | null = null
  private cleanupPaintHandler: (() => void) | null = null

  public glassParams: GlassParams = createDefaultGlassParams()

  constructor(private canvas: HTMLCanvasElement) {}

  async init(): Promise<void> {
    const adapter = await navigator.gpu?.requestAdapter()
    if (!adapter) {
      throw new Error('WebGPU not supported')
    }

    this.device = await adapter.requestDevice()
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext
    this.format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({ device: this.device, format: this.format, alphaMode: 'premultiplied' })

    this.uniformBuffer = this.device.createBuffer({
      size: GLASS_UNIFORM_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.bgSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    })
    this.iconSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    })
    this.textureLoader = new BackgroundTextureLoader(this.device)

    this.bgTexture = this.createEmptyTexture()
    this.iconTexture = this.createEmptyTexture()
    this.bindGroupLayout = createBindGroupLayout(this.device)

    // Initialize player control circles (left, center, right)
    const defaultCircleConfig: CircleConfig = {
      size: 0.32,
      iconUrl: null,
      shadowOpacity: this.glassParams.shadowOpacity,
      shadowBlur: this.glassParams.shadowBlur,
      shadowOffsetX: this.glassParams.shadowOffsetX,
      shadowOffsetY: this.glassParams.shadowOffsetY,
    }
    this._circles = [
      new Circle(this.device, this.textureLoader, this.createEmptyTexture(),
        { ...defaultCircleConfig, size: 0.32 }, () => this.rebuildBindGroup()),
      new Circle(this.device, this.textureLoader, this.createEmptyTexture(),
        { ...defaultCircleConfig, size: 0.42 }, () => this.rebuildBindGroup()),
      new Circle(this.device, this.textureLoader, this.createEmptyTexture(),
        { ...defaultCircleConfig, size: 0.32 }, () => this.rebuildBindGroup()),
    ]

    this.bindGroup = this.createRenderBindGroup()
    this.pipeline = createPipeline(this.device, this.format, this.bindGroupLayout)

    // Detect HTML-in-Canvas support
    this.htmlInCanvasSupport = detectHTMLInCanvasSupport()
    if (this.htmlInCanvasSupport.supported) {
      console.log('HTML-in-Canvas API supported - text selection will work in article mode')
      enableLayoutSubtree(this.canvas)
    }

    window.addEventListener('resize', () => this.resizeCanvas())
    this.resizeCanvas()
  }

  get isHTMLInCanvasSupported(): boolean {
    return this.htmlInCanvasSupport.supported
  }

  async setBackground(type: BackgroundType, options?: BackgroundTemplateOptions): Promise<void> {
    const requestId = ++this.backgroundRequestId
    this.glassParams.articleMode = false

    // Clean up previous HTML-in-Canvas setup
    this.cleanupArticleMode()

    if (isTemplateBackground(type)) {
      const width = this.canvas.clientWidth
      const height = this.canvas.clientHeight
      const dpr = window.devicePixelRatio

      // Create element from template with default image URLs
      let templateOptions = options
      if (type === 'article') {
        templateOptions = { article: { imageUrl: options?.article?.imageUrl ?? `${import.meta.env.BASE_URL}assets/frog.jpg` } }
      } else if (type === 'banner') {
        templateOptions = { banner: { imageUrl: options?.banner?.imageUrl ?? `${import.meta.env.BASE_URL}assets/banner.jpeg` } }
      } else if (type === 'leaves') {
        templateOptions = { leaves: { imageUrl: options?.leaves?.imageUrl ?? `${import.meta.env.BASE_URL}assets/leaves.jpg` } }
      }
      const element = createBackgroundElement(type, templateOptions)
      if (!element) return

      if (this.htmlInCanvasSupport.supported) {
        // HTML-in-Canvas mode: element stays interactive and visible
        await this.setupHTMLInCanvasArticle(element, width, height, dpr)
      } else {
        // Fallback: use html2canvas to capture static image
        await this.setupFallbackArticle(element, width, height, dpr)
      }

      if (requestId !== this.backgroundRequestId) return

      this.glassParams.useImageBg = true
      this.glassParams.articleMode = true
      this.bindGroup = this.createRenderBindGroup()
      return
    }

    if (type === 'grid') {
      this.stopVideo()
      this.glassParams.useImageBg = false
      return
    }

    if (type === 'video') {
      await this.startVideo()
      if (requestId !== this.backgroundRequestId) return
      return
    }

    this.stopVideo()
  }

  /**
   * Set up article using HTML-in-Canvas API (Chrome 147+ with flag)
   * The element becomes a child of the canvas with layoutsubtree.
   * It remains laid out and hit-testable (for text selection) but invisible
   * until we draw it to the texture.
   */
  private async setupHTMLInCanvasArticle(
    articleElement: HTMLElement,
    width: number,
    height: number,
    _dpr: number
  ): Promise<void> {
    this.articleElement = articleElement

    // Set up element for HTML-in-Canvas mode
    articleElement.classList.add('html-in-canvas')
    articleElement.style.width = `${width}px`
    articleElement.style.height = `${height}px`
    articleElement.style.position = 'absolute'
    articleElement.style.left = '0'
    articleElement.style.top = '0'

    // IMPORTANT: Element must be a direct child of the canvas for layoutsubtree to work
    this.canvas.appendChild(articleElement)

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 100))

    // Create texture matching the canvas pixel dimensions exactly
    // This avoids size mismatches between element rendering and texture
    const textureWidth = this.canvas.width
    const textureHeight = this.canvas.height
    this.articleTexture = this.device.createTexture({
      size: [textureWidth, textureHeight],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    // Try to use copyElementImageToTexture
    try {
      this.updateArticleTexture()
      this.bgTexture = this.articleTexture

      // Set up paint handler for live updates
      this.cleanupPaintHandler = setupPaintHandler(this.canvas, () => {
        this.updateArticleTexture()
      })

      console.log('Article mode: HTML-in-Canvas active - text is selectable!')
    } catch (e) {
      console.warn('copyElementImageToTexture failed, falling back to html2canvas:', e)
      // Move element back out of canvas for fallback
      const preview = document.querySelector('.preview')
      if (preview) {
        preview.appendChild(articleElement)
      }
      await this.setupFallbackArticle(articleElement, width, height, _dpr)
    }
  }

  /**
   * Update article texture using copyElementImageToTexture
   */
  private updateArticleTexture(): void {
    if (!this.articleElement || !this.articleTexture) return

    const queue = this.device.queue as GPUQueue & {
      copyElementImageToTexture?: (
        source: HTMLElement,
        width: number,
        height: number,
        destination: GPUImageCopyTextureTagged
      ) => void
    }

    if (!queue.copyElementImageToTexture) {
      throw new Error('copyElementImageToTexture not available')
    }

    // Specify the destination size to match the texture dimensions exactly
    const textureWidth = this.articleTexture.width
    const textureHeight = this.articleTexture.height

    queue.copyElementImageToTexture(
      this.articleElement,
      textureWidth,
      textureHeight,
      { texture: this.articleTexture }
    )
  }

  /**
   * Fallback: use html2canvas to capture static image
   */
  private async setupFallbackArticle(
    articleElement: HTMLElement,
    width: number,
    height: number,
    dpr: number
  ): Promise<void> {
    this.articleElement = articleElement

    // Add to DOM for capture (off-screen)
    const preview = this.canvas.closest('.preview')
    if (preview) {
      preview.appendChild(articleElement)
    } else {
      document.body.appendChild(articleElement)
    }

    // Position element off-screen but visible for capture
    articleElement.style.width = `${width}px`
    articleElement.style.height = `${height}px`
    articleElement.style.position = 'fixed'
    articleElement.style.left = '-9999px'
    articleElement.style.top = '0'
    articleElement.style.visibility = 'visible'

    // Wait for images to load and layout to settle
    await new Promise(resolve => setTimeout(resolve, 300))

    // Capture HTML content as texture
    const capturedCanvas = await html2canvas(articleElement, {
      backgroundColor: '#f8f8f8',
      width,
      height,
      scale: dpr,
      useCORS: true,
      logging: false,
    })

    // Remove element after capture (it's template-created, not needed anymore)
    articleElement.remove()
    this.articleElement = null

    this.bgTexture = this.textureLoader.createTextureFromCanvas(capturedCanvas)
  }

  /**
   * Clean up HTML-in-Canvas article mode
   */
  private cleanupArticleMode(): void {
    if (this.cleanupPaintHandler) {
      this.cleanupPaintHandler()
      this.cleanupPaintHandler = null
    }

    if (this.articleElement) {
      // Remove the template-created element entirely
      this.articleElement.remove()
      this.articleElement = null
    }

    if (this.articleTexture) {
      this.articleTexture.destroy()
      this.articleTexture = null
    }
  }

  async setIcon(url: string | null): Promise<void> {
    const requestId = ++this.iconRequestId
    if (!url) {
      this.iconTexture = this.createEmptyTexture()
      this.bindGroup = this.createRenderBindGroup()
      return
    }

    const texture = await this.textureLoader.load(url)
    if (requestId !== this.iconRequestId) return

    this.iconTexture = texture
    this.bindGroup = this.createRenderBindGroup()
  }

  // Access circles for player controls mode
  get circles(): Circle[] {
    return this._circles
  }

  getCircle(index: number): Circle {
    return this._circles[index]
  }

  // Convenience methods that delegate to circles
  async setIconLeft(url: string | null): Promise<void> {
    await this._circles[0].setIcon(url)
  }

  async setIconRight(url: string | null): Promise<void> {
    await this._circles[2].setIcon(url)
  }

  private rebuildBindGroup(): void {
    this.bindGroup = this.createRenderBindGroup()
  }

  setGridSpeed(speed: number): void {
    const elapsedTime = (performance.now() - this.startTime) / 1000
    const currentOffset = elapsedTime * this.glassParams.gridSpeed + this.gridOffset
    this.glassParams.gridSpeed = speed
    this.gridOffset = currentOffset - elapsedTime * speed
  }

  private async startVideo(): Promise<void> {
    if (this.videoElement) return

    const video = document.createElement('video')
    video.src = videoBackgroundUrl
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      video.oncanplaythrough = () => resolve()
      video.onerror = () => reject(new Error('Failed to load video'))
      video.load()
    })

    await video.play()

    // Wait for first frame to be decoded
    await new Promise<void>((resolve) => {
      if ('requestVideoFrameCallback' in video) {
        (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => void })
          .requestVideoFrameCallback(() => resolve())
      } else {
        requestAnimationFrame(() => resolve())
      }
    })

    this.videoElement = video
    this.bgTexture = this.textureLoader.createTextureFromVideo(video)
    this.glassParams.useImageBg = true
    this.bindGroup = this.createRenderBindGroup()
  }

  private stopVideo(): void {
    if (!this.videoElement) return
    this.videoElement.pause()
    this.videoElement.src = ''
    this.videoElement = null
  }

  isPointInsideGlass(clientX: number, clientY: number): boolean {
    if (this.glassParams.splitMenuMode) {
      return isPointInsideSplitMenu(
        this.canvas,
        this.glassParams,
        this.glassCenterX,
        this.glassCenterY,
        clientX,
        clientY
      )
    }

    if (this.glassParams.playerControlsMode) {
      return this.getClickedCircleIndex(clientX, clientY) >= 0
    }

    return isPointInsideGlass(
      this.canvas,
      this.glassParams,
      this.glassCenterX,
      this.glassCenterY,
      clientX,
      clientY
    )
  }

  isPointInsideSwitchTrack(clientX: number, clientY: number): boolean {
    return isPointInsideSwitchTrack(
      this.canvas,
      this.glassParams,
      this.switchCenterX,
      this.switchCenterY,
      clientX,
      clientY
    )
  }

  getClickedCircleIndex(clientX: number, clientY: number): number {
    if (!this.glassParams.playerControlsMode) return 1

    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    const dpr = window.devicePixelRatio || 1
    const centerX = this.glassCenterX * this.canvas.width
    const centerY = this.glassCenterY * this.canvas.height
    const baseRadius = Math.min(this.canvas.width, this.canvas.height) * 0.35
    const centerRadius = baseRadius * this.glassParams.centerCircleSize
    const leftRadius = baseRadius * this.glassParams.leftCircleSize
    const rightRadius = baseRadius * this.glassParams.rightCircleSize
    const offset = this.glassParams.sideCircleOffset * dpr

    const distCenter = Math.hypot(point.x - centerX, point.y - centerY)
    const distLeft = Math.hypot(point.x - (centerX - offset), point.y - centerY)
    const distRight = Math.hypot(point.x - (centerX + offset), point.y - centerY)

    if (distCenter <= centerRadius) return 1
    if (distLeft <= leftRadius) return 0
    if (distRight <= rightRadius) return 2
    return -1
  }

  setActiveCircleIndex(index: number): void {
    this.glassParams.activeCircleIndex = index
  }

  getClickedSplitMenuIndex(clientX: number, clientY: number): number {
    if (!this.glassParams.splitMenuMode) return -1
    return getClickedSplitMenuIndex(
      this.canvas,
      this.glassParams,
      this.glassCenterX,
      this.glassCenterY,
      clientX,
      clientY
    )
  }

  setActiveSplitMenuIndex(index: number): void {
    this.glassParams.activeSplitMenuIndex = index
  }

  setSwitchMode(enabled: boolean): void {
    this.glassParams.switchMode = enabled
    if (enabled) {
      this.glassParams.sliderMode = false
      this.switchCenterX = 0.5
      this.switchCenterY = 0.5
      this.setSwitchProgress(this.glassParams.switchProgress)
    }
  }

  setSliderMode(enabled: boolean): void {
    this.glassParams.sliderMode = enabled
    if (enabled) {
      this.glassParams.switchMode = false
      this.switchCenterX = 0.5
      this.switchCenterY = 0.5
      this.setSwitchProgress(this.glassParams.switchProgress)
    }
  }

  centerGlass(): void {
    this.glassCenterX = 0.5
    this.glassCenterY = 0.5
  }

  getGlassCenterCssPosition(): { x: number; y: number } {
    return {
      x: this.glassCenterX * this.canvas.clientWidth,
      y: this.glassCenterY * this.canvas.clientHeight,
    }
  }

  setSwitchProgress(progress: number): void {
    this.glassParams.switchProgress = Math.min(Math.max(progress, 0), 1)
    if (!this.glassParams.switchMode && !this.glassParams.sliderMode) return

    const metrics = getSwitchMetrics(
      this.canvas,
      this.glassParams,
      this.switchCenterX,
      this.switchCenterY
    )
    const thumbCenterX = metrics.centerX + (this.glassParams.switchProgress - 0.5) * metrics.travel
    this.glassCenterX = thumbCenterX / this.canvas.width
    this.glassCenterY = metrics.centerY / this.canvas.height
  }

  getSwitchProgress(): number {
    return this.glassParams.switchProgress
  }

  setSwitchProgressFromClientX(clientX: number): void {
    const point = clientPointToCanvasPoint(this.canvas, clientX, 0)
    const metrics = getSwitchMetrics(
      this.canvas,
      this.glassParams,
      this.switchCenterX,
      this.switchCenterY
    )
    if (metrics.travel <= 0) return

    this.setSwitchProgress((point.x - metrics.centerX) / metrics.travel + 0.5)
  }

  getGlassDragOffset(clientX: number, clientY: number): { x: number; y: number } {
    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    return {
      x: point.x - this.glassCenterX * this.canvas.width,
      y: point.y - this.glassCenterY * this.canvas.height,
    }
  }

  setGlassCenterFromClientPoint(
    clientX: number,
    clientY: number,
    dragOffset: { x: number; y: number } = { x: 0, y: 0 }
  ): void {
    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    const bounds = getShapeBounds(this.canvas, this.glassParams)
    const minX = Math.min(bounds.halfWidth, this.canvas.width / 2)
    const maxX = Math.max(this.canvas.width - bounds.halfWidth, this.canvas.width / 2)
    const minY = Math.min(bounds.halfHeight, this.canvas.height / 2)
    const maxY = Math.max(this.canvas.height - bounds.halfHeight, this.canvas.height / 2)

    this.glassCenterX = Math.min(Math.max(point.x - dragOffset.x, minX), maxX) / this.canvas.width
    this.glassCenterY = Math.min(Math.max(point.y - dragOffset.y, minY), maxY) / this.canvas.height
  }

  render(baseShadow?: { opacity: number; blur: number; offsetX: number; offsetY: number }): void {
    this.resizeCanvas()
    if (this.glassParams.switchMode || this.glassParams.sliderMode) {
      this.setSwitchProgress(this.glassParams.switchProgress)
    }

    if (this.videoElement) {
      this.textureLoader.updateTextureFromVideo(this.bgTexture, this.videoElement)
    }

    // Update article texture in HTML-in-Canvas mode for live content
    if (this.articleElement && this.articleTexture && this.htmlInCanvasSupport.copyElementImageToTexture) {
      try {
        this.updateArticleTexture()
      } catch {
        // Silently ignore texture update errors in render loop
      }
    }

    // Sync circle data to glassParams for uniforms
    if (this.glassParams.playerControlsMode && this._circles.length === 3) {
      this.glassParams.leftCircleSize = this._circles[0].size
      this.glassParams.centerCircleSize = this._circles[1].size
      this.glassParams.rightCircleSize = this._circles[2].size
    }

    // Default base shadow to current params if not provided
    const shadowBase = baseShadow ?? {
      opacity: this.glassParams.shadowOpacity,
      blur: this.glassParams.shadowBlur,
      offsetX: this.glassParams.shadowOffsetX,
      offsetY: this.glassParams.shadowOffsetY,
    }

    this.device.queue.writeBuffer(this.uniformBuffer, 0, createGlassUniformData({
      canvas: this.canvas,
      params: this.glassParams,
      baseShadow: shadowBase,
      startTime: this.startTime,
      glassCenterX: this.glassCenterX,
      glassCenterY: this.glassCenterY,
      switchCenterX: this.switchCenterX,
      switchCenterY: this.switchCenterY,
      gridOffset: this.gridOffset,
    }))

    const commandEncoder = this.device.createCommandEncoder()
    const clearColor = this.glassParams.articleMode
      ? { r: 0, g: 0, b: 0, a: 0 }
      : { r: 0.1, g: 0.1, b: 0.12, a: 1 }
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: clearColor,
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    })

    renderPass.setPipeline(this.pipeline)
    renderPass.setBindGroup(0, this.bindGroup)
    renderPass.draw(4)
    renderPass.end()
    this.device.queue.submit([commandEncoder.finish()])
  }

  private createRenderBindGroup(): GPUBindGroup {
    return createBindGroup(
      this.device,
      this.bindGroupLayout,
      this.uniformBuffer,
      this.bgTexture,
      this.bgSampler,
      this.iconTexture,
      this.iconSampler,
      this._circles[0]?.iconTexture ?? this.createEmptyTexture(),
      this._circles[2]?.iconTexture ?? this.createEmptyTexture()
    )
  }

  private createEmptyTexture(): GPUTexture {
    const texture = this.device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    this.device.queue.writeTexture(
      { texture },
      new Uint8Array([0, 0, 0, 0]),
      { bytesPerRow: 4 },
      { width: 1, height: 1 }
    )
    return texture
  }

  private resizeCanvas(): void {
    resizeCanvasToDisplaySize(this.canvas)

    // Update article element size to match canvas in HTML-in-Canvas mode
    if (this.articleElement && this.htmlInCanvasSupport.supported) {
      const width = this.canvas.clientWidth
      const height = this.canvas.clientHeight
      this.articleElement.style.width = `${width}px`
      this.articleElement.style.height = `${height}px`

      // Recreate texture if canvas size changed
      if (this.articleTexture &&
          (this.articleTexture.width !== this.canvas.width ||
           this.articleTexture.height !== this.canvas.height)) {
        this.articleTexture.destroy()
        this.articleTexture = this.device.createTexture({
          size: [this.canvas.width, this.canvas.height],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        })
        this.bgTexture = this.articleTexture
        this.bindGroup = this.createRenderBindGroup()
      }
    }
  }
}
