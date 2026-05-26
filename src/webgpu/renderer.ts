import {
  createBindGroupLayout,
  createBindGroup,
  createPipeline,
} from './shader'

export interface GlassParams {
  bezelWidth: number
  glassThickness: number
  scaleRatio: number
  surfaceType: number  // 0=convex-circle, 1=convex-squircle, 2=concave, 3=lip
  gridCellSize: number // grid cell size in pixels
  gridSpeed: number    // grid animation speed multiplier
  specularOpacity: number // specular highlight opacity (0-1)
  specularAngle: number   // specular light angle in radians
  bgBrightness: number    // background brightness multiplier
  specularSaturation: number // specular saturation boost (1 = normal, >1 = more saturated)
  specularType: number    // 0=rim lighting, 1=layered specular
  scaleX: number          // horizontal scale multiplier for liquid effect
  scaleY: number          // vertical scale multiplier for liquid effect
  blurAmount: number         // blur radius in pixels
  blurType: number           // 0=gaussian, 1=frosted scatter
  shadowOpacity: number      // shadow darkness (0-1)
  shadowBlur: number         // shadow blur/spread in pixels
  shadowOffsetX: number      // shadow horizontal offset
  shadowOffsetY: number      // shadow vertical offset
  progressiveBlur: number    // blur increases toward edges (0-1)
  progressiveBlurType: number // 0=edge falloff, 1=overlay bands
  glassBgOpacity: number     // glass background tint opacity (0-1)
  refractiveIndex: number    // glass refractive index (1.0-2.5)
  magnifyingScale: number    // magnification scale (zoom effect)
  circleSize: number         // circle radius scale multiplier
  shapeType: number          // 0=circle, 1=rectangle
  rectWidth: number          // rectangle width in CSS pixels
  rectHeight: number         // rectangle height in CSS pixels
  rectRadiusPercent: number  // rectangle corner radius as 0-100% of max rounding
  glassTintR: number         // glass tint red channel (0-1)
  glassTintG: number         // glass tint green channel (0-1)
  glassTintB: number         // glass tint blue channel (0-1)
  useImageBg: boolean        // use image background instead of grid
  liquidStrength: number     // click liquidize strength (0-1+)
  switchMode: boolean         // render and interact as a switch
  sliderMode: boolean         // render and interact as a slider
  switchProgress: number      // switch thumb position, 0=off, 1=on
  switchTrackWidth: number    // switch track width in CSS pixels
  switchTrackHeight: number   // switch track height in CSS pixels
  switchTrackOffOpacity: number // off track opacity
  switchTrackOnOpacity: number  // on track opacity
}

export type BackgroundType = 'grid' | 'leaves' | 'banner'

const backgroundImageUrls: Record<Exclude<BackgroundType, 'grid'>, string> = {
  leaves: '/assets/leaves.jpg',
  banner: '/assets/banner.jpeg',
}

export class WebGPURenderer {
  private canvas: HTMLCanvasElement
  private device!: GPUDevice
  private context!: GPUCanvasContext
  private format!: GPUTextureFormat
  private pipeline!: GPURenderPipeline
  private bindGroup!: GPUBindGroup
  private uniformBuffer!: GPUBuffer
  private bgTexture!: GPUTexture
  private bgSampler!: GPUSampler
  private bindGroupLayout!: GPUBindGroupLayout
  private startTime = performance.now()
  private textureCache = new Map<string, GPUTexture>()
  private backgroundRequestId = 0
  private glassCenterX = 0.5
  private glassCenterY = 0.5
  private gridOffset = 0
  private liquidClickX = 0
  private liquidClickY = 0
  private liquidClickStartTime = -1000
  private switchCenterX = 0.5
  private switchCenterY = 0.5

  public glassParams: GlassParams = {
    bezelWidth: 60,
    glassThickness: 50,
    scaleRatio: 1.0,
    surfaceType: 0,
    gridCellSize: 105,
    gridSpeed: 40,
    specularOpacity: 0.4,
    specularAngle: Math.PI / 3, // 60 degrees
    bgBrightness: 1.0,
    specularSaturation: 4.0,
    specularType: 0,
    scaleX: 1.0,
    scaleY: 1.0,
    blurAmount: 0.0,
    blurType: 1,
    shadowOpacity: 0.1,
    shadowBlur: 30,
    shadowOffsetX: 0,
    shadowOffsetY: 15,
    progressiveBlur: 0,
    progressiveBlurType: 0,
    glassBgOpacity: 0,
    refractiveIndex: 1.5,
    magnifyingScale: 0,
    circleSize: 1.0,
    shapeType: 0,
    rectWidth: 420,
    rectHeight: 96,
    rectRadiusPercent: 100,
    glassTintR: 1,
    glassTintG: 1,
    glassTintB: 1,
    useImageBg: false,
    liquidStrength: 0,
    switchMode: false,
    sliderMode: false,
    switchProgress: 1,
    switchTrackWidth: 160,
    switchTrackHeight: 67,
    switchTrackOffOpacity: 0.34,
    switchTrackOnOpacity: 0.86,
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init(): Promise<void> {
    // Initialize WebGPU
    const adapter = await navigator.gpu?.requestAdapter()
    if (!adapter) {
      throw new Error('WebGPU not supported')
    }

    this.device = await adapter.requestDevice()
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext
    this.format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({ device: this.device, format: this.format })

    // Create uniform buffer (56 floats = 224 bytes, padded to 16-byte alignment)
    this.uniformBuffer = this.device.createBuffer({
      size: 224,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    // Create sampler with mipmap support
    this.bgSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    })

    // Load default image texture. Grid mode does not sample it, but the bind group
    // still needs a valid texture binding.
    this.bgTexture = await this.loadBackgroundTexture(backgroundImageUrls.leaves)

    // Create bind group layout and group
    this.bindGroupLayout = createBindGroupLayout(this.device)
    this.bindGroup = createBindGroup(
      this.device,
      this.bindGroupLayout,
      this.uniformBuffer,
      this.bgTexture,
      this.bgSampler
    )

    // Create pipeline
    this.pipeline = createPipeline(this.device, this.format, this.bindGroupLayout)

    // Setup resize listener
    window.addEventListener('resize', () => this.resizeCanvas())
    this.resizeCanvas()
  }

  async setBackground(type: BackgroundType): Promise<void> {
    const requestId = ++this.backgroundRequestId

    if (type === 'grid') {
      this.glassParams.useImageBg = false
      return
    }

    const texture = await this.loadBackgroundTexture(backgroundImageUrls[type])
    if (requestId !== this.backgroundRequestId) return

    this.bgTexture = texture
    this.glassParams.useImageBg = true
    this.bindGroup = createBindGroup(
      this.device,
      this.bindGroupLayout,
      this.uniformBuffer,
      this.bgTexture,
      this.bgSampler
    )
  }

  setGridSpeed(speed: number): void {
    const elapsedTime = (performance.now() - this.startTime) / 1000
    const currentOffset = elapsedTime * this.glassParams.gridSpeed + this.gridOffset
    this.glassParams.gridSpeed = speed
    this.gridOffset = currentOffset - elapsedTime * speed
  }

  private async loadBackgroundTexture(url: string): Promise<GPUTexture> {
    const cachedTexture = this.textureCache.get(url)
    if (cachedTexture) return cachedTexture

    const img = new Image()
    img.src = url
    await img.decode()

    // Calculate mip level count
    const mipLevelCount = Math.floor(Math.log2(Math.max(img.width, img.height))) + 1

    const texture = this.device.createTexture({
      size: [img.width, img.height],
      format: 'rgba8unorm',
      mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    this.device.queue.copyExternalImageToTexture(
      { source: img },
      { texture },
      [img.width, img.height]
    )

    // Generate mipmaps
    await this.generateMipmaps(texture, img.width, img.height, mipLevelCount)

    this.textureCache.set(url, texture)
    return texture
  }

  private async generateMipmaps(texture: GPUTexture, width: number, height: number, mipLevelCount: number): Promise<void> {
    const mipmapShaderModule = this.device.createShaderModule({
      code: `
        var<private> pos: array<vec2f, 4> = array(
          vec2f(-1.0, 1.0), vec2f(1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, -1.0)
        );
        var<private> uv: array<vec2f, 4> = array(
          vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0), vec2f(1.0, 1.0)
        );

        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        }

        @vertex
        fn vs(@builtin(vertex_index) i: u32) -> VertexOutput {
          var o: VertexOutput;
          o.position = vec4f(pos[i], 0.0, 1.0);
          o.texCoord = uv[i];
          return o;
        }

        @group(0) @binding(0) var inTexture: texture_2d<f32>;
        @group(0) @binding(1) var inSampler: sampler;

        @fragment
        fn fs(@location(0) texCoord: vec2f) -> @location(0) vec4f {
          return textureSample(inTexture, inSampler, texCoord);
        }
      `
    })

    const pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: mipmapShaderModule, entryPoint: 'vs' },
      fragment: {
        module: mipmapShaderModule,
        entryPoint: 'fs',
        targets: [{ format: 'rgba8unorm' }]
      },
      primitive: { topology: 'triangle-strip' }
    })

    const sampler = this.device.createSampler({ minFilter: 'linear', magFilter: 'linear' })

    let mipWidth = width
    let mipHeight = height

    for (let i = 1; i < mipLevelCount; i++) {
      const srcView = texture.createView({ baseMipLevel: i - 1, mipLevelCount: 1 })
      mipWidth = Math.max(1, mipWidth >> 1)
      mipHeight = Math.max(1, mipHeight >> 1)
      const dstView = texture.createView({ baseMipLevel: i, mipLevelCount: 1 })

      const bindGroup = this.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: srcView },
          { binding: 1, resource: sampler }
        ]
      })

      const commandEncoder = this.device.createCommandEncoder()
      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: dstView,
          loadOp: 'clear',
          storeOp: 'store'
        }]
      })

      passEncoder.setPipeline(pipeline)
      passEncoder.setBindGroup(0, bindGroup)
      passEncoder.draw(4)
      passEncoder.end()

      this.device.queue.submit([commandEncoder.finish()])
    }
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1
    const displayWidth = this.canvas.clientWidth * dpr
    const displayHeight = this.canvas.clientHeight * dpr

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight
    }
  }

  private getGlassRadius(): number {
    return Math.min(this.canvas.width, this.canvas.height) * 0.35 * this.glassParams.circleSize
  }

  private getRectSize(): { width: number; height: number; radius: number } {
    const dpr = window.devicePixelRatio || 1
    const width = this.glassParams.rectWidth * dpr
    const height = this.glassParams.rectHeight * dpr
    const radiusPercent = Math.min(Math.max(this.glassParams.rectRadiusPercent, 0), 100) / 100
    const radius = Math.min(width, height) * 0.5 * radiusPercent

    return {
      width,
      height,
      radius,
    }
  }

  private getShapeBounds(): { halfWidth: number; halfHeight: number } {
    if (this.glassParams.shapeType === 1) {
      const rect = this.getRectSize()
      return {
        halfWidth: rect.width / 2,
        halfHeight: rect.height / 2,
      }
    }

    const radius = this.getGlassRadius()
    return {
      halfWidth: radius,
      halfHeight: radius,
    }
  }

  private getSwitchMetrics(): {
    centerX: number
    centerY: number
    trackWidth: number
    trackHeight: number
    travel: number
  } {
    const dpr = window.devicePixelRatio || 1
    const trackWidth = this.glassParams.switchTrackWidth * dpr
    const trackHeight = this.glassParams.switchTrackHeight * dpr
    const thumbWidth = this.glassParams.rectWidth * dpr
    const thumbHeight = this.glassParams.rectHeight * dpr
    const centerX = this.switchCenterX * this.canvas.width
    const centerY = this.switchCenterY * this.canvas.height
    const switchInset = 5 * dpr
    const travel = Math.max(0, trackWidth - Math.max(trackHeight, Math.min(thumbWidth, thumbHeight)) - switchInset * 2)

    return { centerX, centerY, trackWidth, trackHeight, travel }
  }

  private clientPointToCanvasPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  isPointInsideGlass(clientX: number, clientY: number): boolean {
    const point = this.clientPointToCanvasPoint(clientX, clientY)
    const centerX = this.glassCenterX * this.canvas.width
    const centerY = this.glassCenterY * this.canvas.height
    const dx = point.x - centerX
    const dy = point.y - centerY

    if (this.glassParams.shapeType === 1) {
      const rect = this.getRectSize()
      const qx = Math.abs(dx) - (rect.width / 2 - rect.radius)
      const qy = Math.abs(dy) - (rect.height / 2 - rect.radius)
      const outsideX = Math.max(qx, 0)
      const outsideY = Math.max(qy, 0)
      const inside = Math.min(Math.max(qx, qy), 0)
      const signedDistance = Math.sqrt(outsideX * outsideX + outsideY * outsideY) + inside - rect.radius

      return signedDistance <= 0
    }

    return Math.sqrt(dx * dx + dy * dy) <= this.getGlassRadius()
  }

  isPointInsideSwitchTrack(clientX: number, clientY: number): boolean {
    if (!this.glassParams.switchMode && !this.glassParams.sliderMode) return false

    const point = this.clientPointToCanvasPoint(clientX, clientY)
    const metrics = this.getSwitchMetrics()
    const radius = metrics.trackHeight / 2
    const signedDistance = this.roundedRectDistance(
      point.x - metrics.centerX,
      point.y - metrics.centerY,
      metrics.trackWidth,
      metrics.trackHeight,
      radius
    )

    return signedDistance <= 0
  }

  private roundedRectDistance(dx: number, dy: number, width: number, height: number, radius: number): number {
    const qx = Math.abs(dx) - (width / 2 - radius)
    const qy = Math.abs(dy) - (height / 2 - radius)
    const outsideX = Math.max(qx, 0)
    const outsideY = Math.max(qy, 0)
    const inside = Math.min(Math.max(qx, qy), 0)

    return Math.sqrt(outsideX * outsideX + outsideY * outsideY) + inside - radius
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

  setSwitchProgress(progress: number): void {
    this.glassParams.switchProgress = Math.min(Math.max(progress, 0), 1)
    if (!this.glassParams.switchMode && !this.glassParams.sliderMode) return

    const metrics = this.getSwitchMetrics()
    const thumbCenterX = metrics.centerX + (this.glassParams.switchProgress - 0.5) * metrics.travel
    this.glassCenterX = thumbCenterX / this.canvas.width
    this.glassCenterY = metrics.centerY / this.canvas.height
  }

  getSwitchProgress(): number {
    return this.glassParams.switchProgress
  }

  setSwitchProgressFromClientX(clientX: number): void {
    const point = this.clientPointToCanvasPoint(clientX, 0)
    const metrics = this.getSwitchMetrics()
    if (metrics.travel <= 0) return

    this.setSwitchProgress((point.x - metrics.centerX) / metrics.travel + 0.5)
  }

  getGlassDragOffset(clientX: number, clientY: number): { x: number; y: number } {
    const point = this.clientPointToCanvasPoint(clientX, clientY)
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
    const point = this.clientPointToCanvasPoint(clientX, clientY)
    const bounds = this.getShapeBounds()
    const minX = Math.min(bounds.halfWidth, this.canvas.width / 2)
    const maxX = Math.max(this.canvas.width - bounds.halfWidth, this.canvas.width / 2)
    const minY = Math.min(bounds.halfHeight, this.canvas.height / 2)
    const maxY = Math.max(this.canvas.height - bounds.halfHeight, this.canvas.height / 2)
    const clampedX = Math.min(Math.max(point.x - dragOffset.x, minX), maxX)
    const clampedY = Math.min(Math.max(point.y - dragOffset.y, minY), maxY)

    this.glassCenterX = clampedX / this.canvas.width
    this.glassCenterY = clampedY / this.canvas.height
  }

  triggerLiquidize(clientX: number, clientY: number, strength = 1): void {
    const point = this.clientPointToCanvasPoint(clientX, clientY)
    this.liquidClickX = point.x
    this.liquidClickY = point.y
    this.liquidClickStartTime = (performance.now() - this.startTime) / 1000
    this.glassParams.liquidStrength = Math.max(this.glassParams.liquidStrength, strength)
  }

  render(): void {
    this.resizeCanvas()
    if (this.glassParams.switchMode || this.glassParams.sliderMode) {
      this.setSwitchProgress(this.glassParams.switchProgress)
    }

    // Calculate glass radius based on canvas size
    const glassRadius = Math.min(this.canvas.width, this.canvas.height) * 0.35 * this.glassParams.circleSize
    const rect = this.getRectSize()

    // Update uniforms
    const uniformTime = (performance.now() - this.startTime) / 1000
    const liquidAge = uniformTime - this.liquidClickStartTime
    const uniformData = new Float32Array([
      this.canvas.width,
      this.canvas.height,
      uniformTime,
      this.glassCenterX * this.canvas.width,   // glass_center_x
      this.glassCenterY * this.canvas.height,  // glass_center_y
      glassRadius,             // glass_radius
      this.glassParams.bezelWidth,
      this.glassParams.glassThickness,
      this.glassParams.scaleRatio,
      this.glassParams.surfaceType,
      this.glassParams.gridCellSize,
      this.glassParams.gridSpeed,
      this.glassParams.specularOpacity,
      this.glassParams.specularAngle,
      this.glassParams.bgBrightness,
      window.devicePixelRatio || 1,
      this.glassParams.specularSaturation,
      this.glassParams.specularType,
      this.glassParams.progressiveBlurType,
      this.glassParams.scaleX,
      this.glassParams.scaleY,
      this.glassParams.blurAmount,
      this.glassParams.shadowOpacity,
      this.glassParams.shadowBlur,
      this.glassParams.shadowOffsetX,
      this.glassParams.shadowOffsetY,
      this.glassParams.progressiveBlur,
      this.glassParams.glassBgOpacity,
      this.glassParams.refractiveIndex,
      this.glassParams.magnifyingScale,
      this.glassParams.useImageBg ? 1.0 : 0.0,
      this.gridOffset,
      this.glassParams.shapeType,
      rect.width,
      rect.height,
      rect.radius,
      this.glassParams.blurType,
      this.glassParams.glassTintR,
      this.glassParams.glassTintG,
      this.glassParams.glassTintB,
      this.liquidClickX,
      this.liquidClickY,
      liquidAge,
      this.glassParams.liquidStrength,
      this.glassParams.switchMode ? 1.0 : 0.0,
      this.glassParams.sliderMode ? 1.0 : 0.0,
      this.glassParams.switchProgress,
      this.glassParams.switchTrackWidth * (window.devicePixelRatio || 1),
      this.glassParams.switchTrackHeight * (window.devicePixelRatio || 1),
      this.switchCenterX * this.canvas.width,
      this.switchCenterY * this.canvas.height,
      this.glassParams.switchTrackOffOpacity,
      this.glassParams.switchTrackOnOpacity,
      0,
      0,
      0,
    ])
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData)

    const commandEncoder = this.device.createCommandEncoder()
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.1, g: 0.1, b: 0.12, a: 1 },
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
}
