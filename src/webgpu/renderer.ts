import html2canvas from 'html2canvas'
import { Circle, type CircleConfig } from './circle'
import { createDefaultGlassParams } from './defaults'
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
  roundedRectDistance,
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
  private static readonly maxCirclePresetCircles = 8
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
  private circlePresetBuffer!: GPUBuffer
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
  // Player controls circles (left, center, right)
  private _circles: Circle[] = []
  private circlePresetCircles: Circle[] = []
  private circlePresetActiveIndex = 0
  private circlePresetIconUrl: string | null = null

  // Video element for fallback mode (when HTML-in-Canvas not supported)
  private videoElement: HTMLVideoElement | null = null
  private readonly videoPlaybackRate = 0.1

  // HTML-in-Canvas support for template backgrounds
  private htmlInCanvasSupport: HTMLInCanvasSupport = { supported: false, copyElementImageToTexture: false }
  private backgroundElement: HTMLElement | null = null
  private backgroundTexture: GPUTexture | null = null
  private backgroundTextureMipLevelCount = 1
  private cleanupPaintHandler: (() => void) | null = null
  private circlePresetStackTextures: GPUTexture[] = []
  private pendingTextureDestroys: GPUTexture[] = []
  private textureDestroyFlushScheduled = false

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
    this.format = this.context.getCurrentTexture().format

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
    this.circlePresetBuffer = this.device.createBuffer({
      size: 8 * 4 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

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
    this.resetCirclePresetCircles()

    this.bindGroup = this.createRenderBindGroup(this.bgTexture)
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

    // Clean up previous background
    this.cleanupBackground()

    // Handle video separately (doesn't use HTML-in-Canvas)
    if (type === 'video') {
      await this.startVideo()
      if (requestId !== this.backgroundRequestId) return
      return
    }

    if (isTemplateBackground(type)) {
      const width = this.canvas.clientWidth
      const height = this.canvas.clientHeight
      const dpr = window.devicePixelRatio

      // Create element from template with default URLs
      let templateOptions = options
      if (type === 'article') {
        templateOptions = { article: { imageUrl: options?.article?.imageUrl ?? `${import.meta.env.BASE_URL}assets/leaves.jpg` } }
      } else if (type === 'banner') {
        templateOptions = { banner: { imageUrl: options?.banner?.imageUrl ?? `${import.meta.env.BASE_URL}assets/banner.jpeg` } }
      }
      const element = createBackgroundElement(type, templateOptions)
      if (!element) return

      if (this.htmlInCanvasSupport.supported) {
        // HTML-in-Canvas mode: element stays interactive and visible
        await this.setupHTMLInCanvas(element, width, height, dpr, type)
      } else {
        // Fallback: use html2canvas to capture static image
        await this.setupFallbackCapture(element, width, height, dpr)
      }

      if (requestId !== this.backgroundRequestId) return

      this.glassParams.useImageBg = true
      this.glassParams.articleMode = true
      this.bindGroup = this.createRenderBindGroup(this.bgTexture)
      return
    }
  }

  /**
   * Set up background using HTML-in-Canvas API (Chrome 147+ with flag)
   * The element becomes a child of the canvas with layoutsubtree.
   * It remains laid out and hit-testable (for text selection) but invisible
   * until we draw it to the texture.
   */
  private async setupHTMLInCanvas(
    bgElement: HTMLElement,
    width: number,
    height: number,
    _dpr: number,
    bgType: string
  ): Promise<void> {
    this.backgroundElement = bgElement

    // Set up element for HTML-in-Canvas mode
    bgElement.classList.add('html-in-canvas')
    bgElement.style.width = `${width}px`
    bgElement.style.height = `${height}px`
    bgElement.style.position = 'absolute'
    bgElement.style.left = '0'
    bgElement.style.top = '0'
    this.syncCssAnimationBackground()

    // IMPORTANT: Element must be a direct child of the canvas for layoutsubtree to work
    this.canvas.appendChild(bgElement)

    // Handle video elements - wait for video to be ready and start playing
    const video = bgElement.querySelector('video')
    if (video) {
      // Wait for video to be ready
      if (video.readyState < 3) {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            video.removeEventListener('canplaythrough', onReady)
            video.removeEventListener('error', onError)
            resolve()
          }
          const onError = () => {
            video.removeEventListener('canplaythrough', onReady)
            video.removeEventListener('error', onError)
            reject(new Error('Failed to load video'))
          }
          video.addEventListener('canplaythrough', onReady)
          video.addEventListener('error', onError)
          video.load()
        })
      }

      try {
        await video.play()
      } catch (e) {
        console.warn('Video autoplay failed:', e)
      }

      // Wait for first frame to be decoded
      await new Promise<void>((resolve) => {
        if ('requestVideoFrameCallback' in video) {
          (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => void })
            .requestVideoFrameCallback(() => resolve())
        } else {
          requestAnimationFrame(() => resolve())
        }
      })
    }

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 100))

    // Create texture matching the canvas pixel dimensions exactly
    // This avoids size mismatches between element rendering and texture
    const textureWidth = this.canvas.width
    const textureHeight = this.canvas.height
    this.backgroundTextureMipLevelCount = Math.floor(Math.log2(Math.max(textureWidth, textureHeight))) + 1
    this.backgroundTexture = this.device.createTexture({
      size: [textureWidth, textureHeight],
      format: 'rgba8unorm',
      mipLevelCount: this.backgroundTextureMipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    // Try to use copyElementImageToTexture
    try {
      this.updateBackgroundTexture()
      this.bgTexture = this.backgroundTexture

      // Set up paint handler for live updates
      this.cleanupPaintHandler = setupPaintHandler(this.canvas, () => {
        this.updateBackgroundTexture()
      })

      console.log(`${bgType} background: HTML-in-Canvas active`)
    } catch (e) {
      console.warn('copyElementImageToTexture failed, falling back to html2canvas:', e)
      // Move element back out of canvas for fallback
      const preview = document.querySelector('.preview')
      if (preview) {
        preview.appendChild(bgElement)
      }
      await this.setupFallbackCapture(bgElement, width, height, _dpr)
    }
  }

  /**
   * Update background texture using copyElementImageToTexture
   */
  private updateBackgroundTexture(): void {
    if (!this.backgroundElement || !this.backgroundTexture) return

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
    const textureWidth = this.backgroundTexture.width
    const textureHeight = this.backgroundTexture.height

    queue.copyElementImageToTexture(
      this.backgroundElement,
      textureWidth,
      textureHeight,
      { texture: this.backgroundTexture }
    )

    if (this.backgroundTextureMipLevelCount > 1) {
      this.textureLoader.generateMipmapsSync(this.backgroundTexture, this.backgroundTextureMipLevelCount)
    }
  }

  /**
   * Fallback: use html2canvas to capture static image
   */
  private async setupFallbackCapture(
    bgElement: HTMLElement,
    width: number,
    height: number,
    dpr: number
  ): Promise<void> {
    this.backgroundElement = bgElement

    // Add to DOM for capture (off-screen)
    const preview = this.canvas.closest('.preview')
    if (preview) {
      preview.appendChild(bgElement)
    } else {
      document.body.appendChild(bgElement)
    }

    // Position element off-screen but visible for capture
    bgElement.style.width = `${width}px`
    bgElement.style.height = `${height}px`
    bgElement.style.position = 'fixed'
    bgElement.style.left = '-9999px'
    bgElement.style.top = '0'
    bgElement.style.visibility = 'visible'
    this.syncCssAnimationBackground()

    // Wait for images to load and layout to settle
    await new Promise(resolve => setTimeout(resolve, 300))

    // Capture HTML content as texture
    const capturedCanvas = await html2canvas(bgElement, {
      backgroundColor: '#f8f8f8',
      width,
      height,
      scale: dpr,
      useCORS: true,
      logging: false,
    })

    // Remove element after capture (it's template-created, not needed anymore)
    bgElement.remove()
    this.backgroundElement = null

    this.bgTexture = this.textureLoader.createTextureFromCanvas(capturedCanvas)
  }

  /**
   * Start video background
   */
  private async startVideo(): Promise<void> {
    if (this.videoElement) return

    const videoUrl = `${import.meta.env.BASE_URL}assets/video.mp4`
    const video = document.createElement('video')
    video.src = videoUrl
    video.loop = false
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.playbackRate = this.videoPlaybackRate
    video.onended = () => {
      video.pause()
    }

    await new Promise<void>((resolve, reject) => {
      video.oncanplaythrough = () => resolve()
      video.onerror = () => reject(new Error('Failed to load video'))
      video.load()
    })

    video.currentTime = 0
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
    this.bindGroup = this.createRenderBindGroup(this.bgTexture)
  }

  /**
   * Clean up background element and textures
   */
  private cleanupBackground(): void {
    if (this.cleanupPaintHandler) {
      this.cleanupPaintHandler()
      this.cleanupPaintHandler = null
    }

    if (this.backgroundElement) {
      // Stop any video that might be playing
      const video = this.backgroundElement.querySelector('video')
      if (video) {
        video.pause()
        video.src = ''
      }
      // Remove the template-created element entirely
      this.backgroundElement.remove()
      this.backgroundElement = null
    }

    // Clean up video fallback mode
    if (this.videoElement) {
      this.videoElement.pause()
      this.videoElement.src = ''
      this.videoElement.onended = null
      this.videoElement = null
    }

    if (this.backgroundTexture) {
      this.deferTextureDestroy(this.backgroundTexture)
      this.backgroundTexture = null
    }
  }

  async setIcon(url: string | null): Promise<void> {
    const requestId = ++this.iconRequestId
    if (!url) {
      this.iconTexture = this.createEmptyTexture()
      this.bindGroup = this.createRenderBindGroup(this.bgTexture)
      return
    }

    const texture = await this.textureLoader.load(url)
    if (requestId !== this.iconRequestId) return

    this.iconTexture = texture
    this.bindGroup = this.createRenderBindGroup(this.bgTexture)
  }

  // Access circles for player controls mode
  get circles(): Circle[] {
    return this._circles
  }

  getCircle(index: number): Circle {
    return this._circles[index]
  }

  get circlePresetCirclesCount(): number {
    return this.circlePresetCircles.length
  }

  getCirclePresetCircle(index: number): Circle {
    const circle = this.circlePresetCircles[index]
    if (!circle) {
      throw new Error(`Missing circle preset circle at index ${index}`)
    }
    return circle
  }

  getCirclePresetActiveIndex(): number {
    return this.circlePresetActiveIndex
  }

  resetCirclePresetCircles(): void {
    const size = this.glassParams.circleSize
    this.circlePresetCircles = [
      this.createCirclePresetCircle(size, 0.5, 0.5),
    ]
    void this.setCirclePresetIcon(this.circlePresetIconUrl)
    this.circlePresetActiveIndex = 0
    this.glassParams.circlePresetCount = this.circlePresetCircles.length
    this.glassParams.circlePresetActiveIndex = this.circlePresetActiveIndex
  }

  addCirclePresetCircle(): number {
    if (this.circlePresetCircles.length >= WebGPURenderer.maxCirclePresetCircles) {
      return this.circlePresetCircles.length - 1
    }

    const nextIndex = this.circlePresetCircles.length
    const base = this.getCirclePresetBaseRadius()
    const size = this.glassParams.circleSize
    const previous = this.circlePresetCircles[nextIndex - 1] ?? this.circlePresetCircles[0]
    let centerX = previous?.centerX ?? 0.5
    let centerY = previous?.centerY ?? 0.5

    if (this.glassParams.circlePresetStrategy === 0) {
      const verticalStep = Math.max((base * size * 2.0) / this.canvas.height * 1.08, 0.06)
      centerY = Math.min(centerY + verticalStep, 0.9)
    } else {
      const pair = Math.max(1, Math.floor(nextIndex / 2) + 1)
      const direction = nextIndex % 2 === 0 ? -1 : 1
      const horizontalStep = (base * size * 2.0 / this.canvas.width) * (0.5 + pair * 0.12)
      const verticalStep = (base * size * 2.0 / this.canvas.height) * (0.12 * pair)
      centerX = Math.min(Math.max(0.5 + direction * horizontalStep, 0.1), 0.9)
      centerY = Math.min(Math.max(0.5 + verticalStep * (nextIndex % 4 === 0 ? -1 : 1), 0.1), 0.9)
    }

    const circle = this.createCirclePresetCircle(size, centerX, centerY)
    this.circlePresetCircles.push(circle)
    void circle.setIcon(this.circlePresetIconUrl)
    this.circlePresetActiveIndex = nextIndex
    this.glassParams.circlePresetCount = this.circlePresetCircles.length
    this.glassParams.circlePresetActiveIndex = this.circlePresetActiveIndex
    return nextIndex
  }

  async setCirclePresetIcon(url: string | null): Promise<void> {
    this.circlePresetIconUrl = url
    await Promise.all(this.circlePresetCircles.map((circle) => circle.setIcon(url)))
  }

  setCirclePresetActiveIndex(index: number): void {
    this.circlePresetActiveIndex = Math.min(Math.max(index, 0), this.circlePresetCircles.length - 1)
    this.glassParams.circlePresetActiveIndex = this.circlePresetActiveIndex
  }

  setCirclePresetStrategy(strategy: number): void {
    this.glassParams.circlePresetStrategy = strategy
  }

  setCirclePresetCircleSize(index: number, size: number): void {
    const circle = this.circlePresetCircles[index]
    if (!circle) return
    circle.size = size
    this.glassParams.circleSize = size
  }

  getClickedCirclePresetIndex(clientX: number, clientY: number): number {
    if (!this.glassParams.circlePresetMode) return -1

    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    const baseRadius = this.getCirclePresetBaseRadius()
    const dpr = window.devicePixelRatio || 1
    const rectWidth = this.glassParams.rectWidth * dpr
    const rectHeight = this.glassParams.rectHeight * dpr
    const rectRadius = Math.min(this.glassParams.rectRadiusPercent, 100) / 100 * Math.min(rectWidth, rectHeight) * 0.5
    let closestIndex = -1
    let closestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < this.circlePresetCircles.length; index++) {
      const circle = this.circlePresetCircles[index]
      const centerX = circle.centerX * this.canvas.width
      const centerY = circle.centerY * this.canvas.height
      const scale = circle.size
      const distance = this.glassParams.shapeType === 1
        ? roundedRectDistance(
            point.x - centerX,
            point.y - centerY,
            rectWidth * scale,
            rectHeight * scale,
            rectRadius * scale
          )
        : Math.hypot(point.x - centerX, point.y - centerY) - baseRadius * circle.size
      const hitDistance = this.glassParams.circlePresetStrategy === 1 ? distance - 4 : distance
      if (hitDistance <= 0 && distance < closestDistance) {
        closestIndex = index
        closestDistance = distance
      }
    }

    return closestIndex
  }

  getCirclePresetDragOffset(index: number, clientX: number, clientY: number): { x: number; y: number } {
    const circle = this.circlePresetCircles[index]
    if (!circle) return { x: 0, y: 0 }
    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    return {
      x: point.x - circle.centerX * this.canvas.width,
      y: point.y - circle.centerY * this.canvas.height,
    }
  }

  setCirclePresetCircleFromClientPoint(
    index: number,
    clientX: number,
    clientY: number,
    dragOffset: { x: number; y: number } = { x: 0, y: 0 }
  ): void {
    const circle = this.circlePresetCircles[index]
    if (!circle) return

    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    const dpr = window.devicePixelRatio || 1
    const radius = this.getCirclePresetBaseRadius() * circle.size
    const rectHalfWidth = this.glassParams.shapeType === 1
      ? this.glassParams.rectWidth * dpr * circle.size * 0.5
      : radius
    const rectHalfHeight = this.glassParams.shapeType === 1
      ? this.glassParams.rectHeight * dpr * circle.size * 0.5
      : radius
    const minX = rectHalfWidth
    const maxX = this.canvas.width - rectHalfWidth
    const minY = rectHalfHeight
    const maxY = this.canvas.height - rectHalfHeight

    circle.centerX = Math.min(Math.max(point.x - dragOffset.x, minX), maxX) / this.canvas.width
    circle.centerY = Math.min(Math.max(point.y - dragOffset.y, minY), maxY) / this.canvas.height
  }

  // Convenience methods that delegate to circles
  async setIconLeft(url: string | null): Promise<void> {
    await this._circles[0].setIcon(url)
  }

  async setIconRight(url: string | null): Promise<void> {
    await this._circles[2].setIcon(url)
  }

  private rebuildBindGroup(): void {
    this.bindGroup = this.createRenderBindGroup(this.bgTexture)
  }

  private updateCirclePresetBuffer(circles: Circle[] = this.circlePresetCircles, activeIndex: number = this.circlePresetActiveIndex): void {
    const circleData = new Float32Array(8 * 4)
    for (let index = 0; index < Math.min(circles.length, 8); index++) {
      const circle = circles[index]
      circleData[index * 4 + 0] = circle.centerX * this.canvas.width
      circleData[index * 4 + 1] = circle.centerY * this.canvas.height
      circleData[index * 4 + 2] = circle.size
      circleData[index * 4 + 3] = index === activeIndex ? 1 : 0
    }
    this.device.queue.writeBuffer(this.circlePresetBuffer, 0, circleData)
  }

  private getCirclePresetStackTexture(index: number, format: GPUTextureFormat): GPUTexture {
    const width = this.canvas.width
    const height = this.canvas.height
    const mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1
    const existing = this.circlePresetStackTextures[index]
    if (existing && existing.width === width && existing.height === height) {
      return existing
    }

    if (existing) {
      this.deferTextureDestroy(existing)
    }

    const texture = this.device.createTexture({
      size: [width, height],
      format,
      mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })
    this.circlePresetStackTextures[index] = texture
    return texture
  }

  private getCirclePresetBaseRadius(): number {
    if (this.glassParams.shapeType === 1) {
      return Math.max(this.glassParams.rectWidth, this.glassParams.rectHeight) * (window.devicePixelRatio || 1) * 0.5
    }
    return Math.min(this.canvas.width, this.canvas.height) * 0.35
  }

  private createCirclePresetCircle(size: number, centerX: number, centerY: number): Circle {
    const defaultCircleConfig: CircleConfig = {
      size,
      iconUrl: null,
      shadowOpacity: this.glassParams.shadowOpacity,
      shadowBlur: this.glassParams.shadowBlur,
      shadowOffsetX: this.glassParams.shadowOffsetX,
      shadowOffsetY: this.glassParams.shadowOffsetY,
    }
    const circle = new Circle(
      this.device,
      this.textureLoader,
      this.createEmptyTexture(),
      defaultCircleConfig,
      () => this.rebuildBindGroup()
    )
    circle.centerX = centerX
    circle.centerY = centerY
    return circle
  }

  setGridSpeed(speed: number): void {
    const elapsedTime = (performance.now() - this.startTime) / 1000
    const currentOffset = elapsedTime * this.glassParams.gridSpeed + this.gridOffset
    this.glassParams.gridSpeed = speed
    this.gridOffset = currentOffset - elapsedTime * speed
    this.syncCssAnimationBackground()
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

    if (this.glassParams.circlePresetMode) {
      return this.getClickedCirclePresetIndex(clientX, clientY) >= 0
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

  getSwitchProgressFromClientX(clientX: number): number | null {
    const point = clientPointToCanvasPoint(this.canvas, clientX, 0)
    const metrics = getSwitchMetrics(
      this.canvas,
      this.glassParams,
      this.switchCenterX,
      this.switchCenterY
    )
    if (metrics.travel <= 0) return null

    return (point.x - metrics.centerX) / metrics.travel + 0.5
  }

  setSwitchProgressFromClientX(clientX: number): void {
    const progress = this.getSwitchProgressFromClientX(clientX)
    if (progress === null) return

    this.setSwitchProgress(progress)
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
    this.syncCssAnimationBackground()
    if (this.glassParams.switchMode || this.glassParams.sliderMode) {
      this.setSwitchProgress(this.glassParams.switchProgress)
    }

    // Update texture in HTML-in-Canvas mode for live content (including video)
    if (this.backgroundElement && this.backgroundTexture && this.htmlInCanvasSupport.copyElementImageToTexture) {
      try {
        this.updateBackgroundTexture()
      } catch {
        // Silently ignore texture update errors in render loop
      }
    }

    // Update video texture in fallback mode
    if (this.videoElement) {
      this.textureLoader.updateTextureFromVideo(this.bgTexture, this.videoElement)
    }

    // Sync circle data to glassParams for uniforms
    if (this.glassParams.playerControlsMode && this._circles.length === 3) {
      this.glassParams.leftCircleSize = this._circles[0].size
      this.glassParams.centerCircleSize = this._circles[1].size
      this.glassParams.rightCircleSize = this._circles[2].size
    }
    if (this.glassParams.circlePresetMode) {
      this.glassParams.circlePresetCount = this.circlePresetCircles.length
      this.glassParams.circlePresetActiveIndex = this.circlePresetActiveIndex
      const activeCircle = this.circlePresetCircles[this.circlePresetActiveIndex] ?? this.circlePresetCircles[0]
      if (activeCircle) {
        this.glassParams.circleSize = activeCircle.size
      }
    }
    this.updateCirclePresetBuffer()

    // Default base shadow to current params if not provided
    const shadowBase = baseShadow ?? {
      opacity: this.glassParams.shadowOpacity,
      blur: this.glassParams.shadowBlur,
      offsetX: this.glassParams.shadowOffsetX,
      offsetY: this.glassParams.shadowOffsetY,
    }

    if (this.glassParams.circlePresetMode && this.glassParams.circlePresetStrategy === 0) {
      this.renderCirclePresetStack(shadowBase)
      return
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

  private renderCirclePresetStack(baseShadow: { opacity: number; blur: number; offsetX: number; offsetY: number }): void {
    const circles = this.circlePresetCircles.slice(0, 8)
    if (circles.length === 0) return

    const originalActiveIndex = this.circlePresetActiveIndex
    const originalScaleX = this.glassParams.scaleX
    const originalScaleY = this.glassParams.scaleY
    const originalLiquidEnabled = this.glassParams.liquidEnabled
    const orderedCircles = circles
      .map((circle, index) => ({ circle, index }))
      .sort((a, b) => {
        if (a.index === originalActiveIndex) return 1
        if (b.index === originalActiveIndex) return -1
        return a.index - b.index
      })

    let sourceTexture = this.bgTexture
    const lastIndex = orderedCircles.length - 1
    const renderFormat = this.format

    for (let orderIndex = 0; orderIndex < orderedCircles.length; orderIndex++) {
      const { circle, index } = orderedCircles[orderIndex]
      const isActivePass = index === originalActiveIndex
      this.updateCirclePresetBuffer([circle], isActivePass ? 0 : -1)

      this.glassParams.circlePresetMode = true
      this.glassParams.circlePresetStrategy = 0
      this.glassParams.circlePresetCount = 1
      this.glassParams.circlePresetActiveIndex = isActivePass ? 0 : 1
      this.glassParams.circleSize = circle.size
      this.glassParams.scaleX = isActivePass ? originalScaleX : 1.0
      this.glassParams.scaleY = isActivePass ? originalScaleY : 1.0
      this.glassParams.liquidEnabled = isActivePass ? originalLiquidEnabled : false

      this.device.queue.writeBuffer(this.uniformBuffer, 0, createGlassUniformData({
        canvas: this.canvas,
        params: this.glassParams,
        baseShadow,
        startTime: this.startTime,
        glassCenterX: this.glassCenterX,
        glassCenterY: this.glassCenterY,
        switchCenterX: this.switchCenterX,
        switchCenterY: this.switchCenterY,
        gridOffset: this.gridOffset,
      }))

      const renderToCanvas = orderIndex === lastIndex
      const targetTexture = renderToCanvas ? this.context.getCurrentTexture() : this.getCirclePresetStackTexture(index, renderFormat)
      const commandEncoder = this.device.createCommandEncoder()
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: targetTexture.createView({ baseMipLevel: 0, mipLevelCount: 1 }),
            clearValue: this.glassParams.articleMode
              ? { r: 0, g: 0, b: 0, a: 0 }
              : { r: 0.1, g: 0.1, b: 0.12, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      })

      const bindGroup = this.createRenderBindGroup(sourceTexture, circle.iconTexture)
      renderPass.setPipeline(this.pipeline)
      renderPass.setBindGroup(0, bindGroup)
      renderPass.draw(4)
      renderPass.end()
      this.device.queue.submit([commandEncoder.finish()])

      if (!renderToCanvas) {
        const mipLevelCount = Math.floor(Math.log2(Math.max(targetTexture.width, targetTexture.height))) + 1
        this.textureLoader.generateMipmapsSync(targetTexture, mipLevelCount)
        sourceTexture = targetTexture
      }
    }

    this.glassParams.circlePresetActiveIndex = originalActiveIndex
    this.glassParams.scaleX = originalScaleX
    this.glassParams.scaleY = originalScaleY
    this.glassParams.liquidEnabled = originalLiquidEnabled
  }

  private createRenderBindGroup(texture: GPUTexture, iconTexture: GPUTexture = this.iconTexture): GPUBindGroup {
    return createBindGroup(
      this.device,
      this.bindGroupLayout,
      this.uniformBuffer,
      texture,
      this.bgSampler,
      iconTexture,
      this.iconSampler,
      this._circles[0]?.iconTexture ?? this.createEmptyTexture(),
      this._circles[2]?.iconTexture ?? this.createEmptyTexture(),
      this.circlePresetBuffer
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
    if (this.backgroundElement && this.htmlInCanvasSupport.supported) {
      const width = this.canvas.clientWidth
      const height = this.canvas.clientHeight
      this.backgroundElement.style.width = `${width}px`
      this.backgroundElement.style.height = `${height}px`

      // Recreate texture if canvas size changed
      if (this.backgroundTexture &&
          (this.backgroundTexture.width !== this.canvas.width ||
           this.backgroundTexture.height !== this.canvas.height)) {
        this.deferTextureDestroy(this.backgroundTexture)
        this.backgroundTextureMipLevelCount = Math.floor(Math.log2(Math.max(this.canvas.width, this.canvas.height))) + 1
        this.backgroundTexture = this.device.createTexture({
          size: [this.canvas.width, this.canvas.height],
          format: 'rgba8unorm',
          mipLevelCount: this.backgroundTextureMipLevelCount,
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        })
        this.bgTexture = this.backgroundTexture
        this.bindGroup = this.createRenderBindGroup(this.bgTexture)
      }
    }
  }

  private syncCssAnimationBackground(): void {
    if (this.backgroundElement?.dataset.background !== 'grid') return

    const dpr = window.devicePixelRatio || 1
    const cellSize = Math.max(this.glassParams.gridCellSize / dpr, 1)
    const lineWidth = Math.max(3 / dpr, 1)
    const speed = Math.max(this.glassParams.gridSpeed, 0)
    const duration = speed > 0 ? this.glassParams.gridCellSize / speed : 1

    this.backgroundElement.style.setProperty('--css-grid-cell-size', `${cellSize}px`)
    this.backgroundElement.style.setProperty('--css-grid-line-width', `${lineWidth}px`)
    this.backgroundElement.style.setProperty('--css-grid-duration', `${duration}s`)
    this.backgroundElement.style.setProperty('--css-grid-play-state', speed > 0 ? 'running' : 'paused')
  }

  private deferTextureDestroy(texture: GPUTexture): void {
    this.pendingTextureDestroys.push(texture)
    this.scheduleTextureDestroyFlush()
  }

  private scheduleTextureDestroyFlush(): void {
    if (this.textureDestroyFlushScheduled) return
    this.textureDestroyFlushScheduled = true

    void this.device.queue.onSubmittedWorkDone().then(() => {
      this.textureDestroyFlushScheduled = false

      const textures = this.pendingTextureDestroys
      this.pendingTextureDestroys = []
      for (const texture of textures) {
        texture.destroy()
      }

      if (this.pendingTextureDestroys.length > 0) {
        this.scheduleTextureDestroyFlush()
      }
    })
  }
}
