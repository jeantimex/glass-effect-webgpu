import html2canvas from 'html2canvas'
import { GlassInstanceManager, CircleInstance, RectangleInstance, GlassInstance } from './glass-instance-manager'
import type { ShapeType } from './glass-instance-manager'
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
  getShapeBounds,
  isPointInsideGlass,
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
export { GlassInstance } from './glass-instance'
export { CircleInstance, type CircleInstanceConfig } from './circle-instance'
export { RectangleInstance, type RectangleInstanceConfig } from './rectangle-instance'
export { GlassInstanceManager, type ShapeType } from './glass-instance-manager'

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
  // Glass preset instances with per-instance properties (circles or rectangles)
  private _glassInstanceManager!: GlassInstanceManager

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

    this.bgTexture = this.createEmptyTexture()
    this.iconTexture = this.createEmptyTexture()
    this.bindGroupLayout = createBindGroupLayout(this.device)

    // Initialize glass instance manager for circle/rectangle preset modes
    this._glassInstanceManager = new GlassInstanceManager(
      this.device,
      this.textureLoader,
      this.createEmptyTexture(),
      () => this.rebuildBindGroup()
    )

    this.bindGroup = this.createRenderBindGroup(this.bgTexture)
    this.pipeline = createPipeline(this.device, this.format, this.bindGroupLayout)

    // Detect HTML-in-Canvas support
    this.htmlInCanvasSupport = detectHTMLInCanvasSupport()
    if (this.htmlInCanvasSupport.supported) {
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
    _bgType: string
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

    if (this.backgroundTexture) {
      this.bgTexture = this.createEmptyTexture()
      this.bindGroup = this.createRenderBindGroup(this.bgTexture)
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

  // Glass instance manager for circle/rectangle preset modes
  get glassInstanceManager(): GlassInstanceManager {
    return this._glassInstanceManager
  }

  get glassPresetInstanceCount(): number {
    return this._glassInstanceManager.count
  }

  getGlassPresetInstance(index: number): GlassInstance {
    const instance = this._glassInstanceManager.getInstance(index)
    if (!instance) {
      throw new Error(`Missing glass preset instance at index ${index}`)
    }
    return instance
  }

  getCirclePresetCircle(index: number): CircleInstance {
    const instance = this._glassInstanceManager.getCircleInstance(index)
    if (!instance) {
      throw new Error(`Missing circle preset instance at index ${index}`)
    }
    return instance
  }

  getRectanglePresetInstance(index: number): RectangleInstance {
    const instance = this._glassInstanceManager.getRectangleInstance(index)
    if (!instance) {
      throw new Error(`Missing rectangle preset instance at index ${index}`)
    }
    return instance
  }

  getCirclePresetActiveIndex(): number {
    return this._glassInstanceManager.activeIndex
  }

  getActiveCircleInstance(): CircleInstance | undefined {
    return this._glassInstanceManager.activeInstance instanceof CircleInstance
      ? this._glassInstanceManager.activeInstance
      : undefined
  }

  getActiveRectangleInstance(): RectangleInstance | undefined {
    return this._glassInstanceManager.activeInstance instanceof RectangleInstance
      ? this._glassInstanceManager.activeInstance
      : undefined
  }

  getActiveGlassInstance(): GlassInstance | undefined {
    return this._glassInstanceManager.activeInstance
  }

  resetCirclePresetCircles(): void {
    const shapeType: ShapeType = this.glassParams.shapeType === 1 ? 'rectangle' : 'circle'
    const baseConfig = {
      bezelWidth: this.glassParams.bezelWidth,
      glassThickness: this.glassParams.glassThickness,
      refractiveIndex: this.glassParams.refractiveIndex,
      magnifyingScale: this.glassParams.magnifyingScale,
      scaleRatio: this.glassParams.scaleRatio,
      shadowOpacity: this.glassParams.shadowOpacity,
      shadowBlur: this.glassParams.shadowBlur,
      shadowOffsetX: this.glassParams.shadowOffsetX,
      shadowOffsetY: this.glassParams.shadowOffsetY,
      blurAmount: this.glassParams.blurAmount,
      blurType: this.glassParams.blurType,
      progressiveBlur: this.glassParams.progressiveBlur,
      progressiveBlurType: this.glassParams.progressiveBlurType,
      specularOpacity: this.glassParams.specularOpacity,
      specularAngle: this.glassParams.specularAngle,
      specularSaturation: this.glassParams.specularSaturation,
      specularType: this.glassParams.specularType,
      glassTintR: this.glassParams.glassTintR,
      glassTintG: this.glassParams.glassTintG,
      glassTintB: this.glassParams.glassTintB,
      glassBgOpacity: this.glassParams.glassBgOpacity,
      chromaticAberration: this.glassParams.chromaticAberration,
      chromaticStrength: this.glassParams.chromaticStrength,
      chromaticBase: this.glassParams.chromaticBase,
    }

    if (shapeType === 'rectangle') {
      this._glassInstanceManager.reset(shapeType, {
        ...baseConfig,
        rectWidth: this.glassParams.rectWidth,
        rectHeight: this.glassParams.rectHeight,
        rectRadius: this.glassParams.rectRadiusPercent / 100 * Math.min(this.glassParams.rectWidth, this.glassParams.rectHeight) * 0.5,
      })
    } else {
      this._glassInstanceManager.reset(shapeType, {
        ...baseConfig,
        size: this.glassParams.circleSize,
      })
    }

    this.glassParams.circlePresetCount = this._glassInstanceManager.count
    this.glassParams.circlePresetActiveIndex = this._glassInstanceManager.activeIndex
  }

  addCirclePresetCircle(): number {
    const index = this._glassInstanceManager.addInstance()
    this.glassParams.circlePresetCount = this._glassInstanceManager.count
    this.glassParams.circlePresetActiveIndex = this._glassInstanceManager.activeIndex
    return index
  }

  async setCirclePresetIcon(url: string | null): Promise<void> {
    await this._glassInstanceManager.setIconForAll(url)
  }

  setCirclePresetActiveIndex(index: number): void {
    this._glassInstanceManager.setActiveIndex(index)
    this.glassParams.circlePresetActiveIndex = this._glassInstanceManager.activeIndex
  }

  setCirclePresetStrategy(strategy: number): void {
    this.glassParams.circlePresetStrategy = strategy
    this._glassInstanceManager.strategy = strategy
  }

  setMixedMode(enabled: boolean): void {
    this._glassInstanceManager.mixedMode = enabled
  }

  addGlassInstance(shapeType?: 'circle' | 'rectangle'): number {
    const index = this._glassInstanceManager.addInstance(undefined, shapeType)
    this.glassParams.circlePresetCount = this._glassInstanceManager.count
    this.glassParams.circlePresetActiveIndex = this._glassInstanceManager.activeIndex
    return index
  }

  setCirclePresetCircleSize(index: number, size: number): void {
    const instance = this._glassInstanceManager.getCircleInstance(index)
    if (!instance) return
    instance.size = size
    this.glassParams.circleSize = size
  }

  getClickedCirclePresetIndex(clientX: number, clientY: number): number {
    if (!this.glassParams.circlePresetMode) return -1

    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    const dpr = window.devicePixelRatio || 1
    return this._glassInstanceManager.getClickedInstanceIndex(
      this.canvas.width,
      this.canvas.height,
      point.x,
      point.y,
      dpr
    )
  }

  getCirclePresetDragOffset(index: number, clientX: number, clientY: number): { x: number; y: number } {
    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    return this._glassInstanceManager.getDragOffset(
      index,
      this.canvas.width,
      this.canvas.height,
      point.x,
      point.y
    )
  }

  setCirclePresetCircleFromClientPoint(
    index: number,
    clientX: number,
    clientY: number,
    dragOffset: { x: number; y: number } = { x: 0, y: 0 }
  ): void {
    const point = clientPointToCanvasPoint(this.canvas, clientX, clientY)
    const dpr = window.devicePixelRatio || 1
    this._glassInstanceManager.setInstancePositionFromPoint(
      index,
      this.canvas.width,
      this.canvas.height,
      point.x,
      point.y,
      dragOffset,
      dpr
    )
  }

  removeGlassInstance(index: number): boolean {
    const removed = this._glassInstanceManager.removeInstance(index)
    if (removed) {
      this.glassParams.circlePresetCount = this._glassInstanceManager.count
      this.glassParams.circlePresetActiveIndex = this._glassInstanceManager.activeIndex
    }
    return removed
  }

  clearGlassInstances(): void {
    this._glassInstanceManager.clear()
    this.glassParams.circlePresetCount = 0
    this.glassParams.circlePresetActiveIndex = -1
  }

  private rebuildBindGroup(): void {
    this.bindGroup = this.createRenderBindGroup(this.bgTexture)
  }

  private updateCircleInstanceBuffer(): void {
    const dpr = window.devicePixelRatio || 1
    this._glassInstanceManager.updateStorageBuffer(this.canvas.width, this.canvas.height, dpr)
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

  setGridSpeed(speed: number): void {
    const elapsedTime = (performance.now() - this.startTime) / 1000
    const currentOffset = elapsedTime * this.glassParams.gridSpeed + this.gridOffset
    this.glassParams.gridSpeed = speed
    this.gridOffset = currentOffset - elapsedTime * speed
    this.syncCssAnimationBackground()
  }

  isPointInsideGlass(clientX: number, clientY: number): boolean {
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

    // Update texture in HTML-in-Canvas mode for live content
    if (this.backgroundElement && this.backgroundTexture && this.htmlInCanvasSupport.copyElementImageToTexture) {
      try {
        this.updateBackgroundTexture()
      } catch {
        // Silently ignore texture update errors in render loop
      }
    }

    // Sync instance data to glassParams for uniforms
    if (this.glassParams.circlePresetMode) {
      this.glassParams.circlePresetCount = this._glassInstanceManager.count
      this.glassParams.circlePresetActiveIndex = this._glassInstanceManager.activeIndex
      const activeInstance = this._glassInstanceManager.activeInstance
      if (activeInstance) {
        const circleInstance = activeInstance instanceof CircleInstance ? activeInstance : null
        if (circleInstance) {
          this.glassParams.circleSize = circleInstance.size
        }
        activeInstance.scaleX = this.glassParams.scaleX
        activeInstance.scaleY = this.glassParams.scaleY
      }
    }
    this.updateCircleInstanceBuffer()

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
    const instances = this._glassInstanceManager.instances.slice(0, 8)
    if (instances.length === 0) {
      // No instances - render background only (no glass)
      this.glassParams.circlePresetCount = 0
      this.device.queue.writeBuffer(this.uniformBuffer, 0, createGlassUniformData({
        canvas: this.canvas,
        params: this.glassParams,
        baseShadow,
        startTime: this.startTime,
        glassCenterX: this.glassCenterX,
        glassCenterY: this.glassCenterY,
        gridOffset: this.gridOffset,
      }))

      const commandEncoder = this.device.createCommandEncoder()
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: this.context.getCurrentTexture().createView(),
            clearValue: this.glassParams.articleMode
              ? { r: 0, g: 0, b: 0, a: 0 }
              : { r: 0.1, g: 0.1, b: 0.12, a: 1 },
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
      return
    }

    const originalActiveIndex = this._glassInstanceManager.activeIndex
    const originalScaleX = this.glassParams.scaleX
    const originalScaleY = this.glassParams.scaleY
    const originalLiquidEnabled = this.glassParams.liquidEnabled
    const dpr = window.devicePixelRatio || 1

    // Order instances: render active last so it appears on top
    const orderedInstances = instances
      .map((instance, index) => ({ instance, index }))
      .sort((a, b) => {
        if (a.index === originalActiveIndex) return 1
        if (b.index === originalActiveIndex) return -1
        return a.index - b.index
      })

    let sourceTexture = this.bgTexture
    const lastIndex = orderedInstances.length - 1
    const renderFormat = this.format

    for (let orderIndex = 0; orderIndex < orderedInstances.length; orderIndex++) {
      const { instance, index } = orderedInstances[orderIndex]
      const isActivePass = index === originalActiveIndex

      // Update instance active state for this pass
      instance.isActive = isActivePass
      if (isActivePass) {
        instance.scaleX = originalScaleX
        instance.scaleY = originalScaleY
      } else {
        instance.scaleX = 1.0
        instance.scaleY = 1.0
      }

      // Write single instance to buffer position 0 for stack mode rendering
      this._glassInstanceManager.writeSingleInstanceToBuffer(instance, this.canvas.width, this.canvas.height, dpr, 0)

      this.glassParams.circlePresetMode = true
      this.glassParams.circlePresetStrategy = 0
      this.glassParams.circlePresetCount = 1
      this.glassParams.circlePresetActiveIndex = isActivePass ? 0 : 1
      if (instance instanceof CircleInstance) {
        this.glassParams.circleSize = instance.size
      }
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

      const bindGroup = this.createRenderBindGroup(sourceTexture, instance.iconTexture)
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

    // Restore original state
    this._glassInstanceManager.setActiveIndex(originalActiveIndex)
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
      this.createEmptyTexture(),
      this.createEmptyTexture(),
      this._glassInstanceManager.storageBuffer
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
