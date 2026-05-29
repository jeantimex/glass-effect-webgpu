import type { BackgroundTextureLoader } from './texture-loader'

export interface CircleInstanceConfig {
  // Position
  centerX: number
  centerY: number

  // Size & shape
  size: number
  shapeType: number // 0 = circle, 1 = rect
  rectWidth: number
  rectHeight: number
  rectRadius: number

  // Surface & refraction
  surfaceType: number
  bezelWidth: number
  glassThickness: number
  refractiveIndex: number
  magnifyingScale: number
  scaleRatio: number
  maxDisplacementScale: number

  // Shadow
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number

  // Blur
  blurAmount: number
  blurType: number
  progressiveBlur: number
  progressiveBlurType: number

  // Specular
  specularOpacity: number
  specularAngle: number
  specularSaturation: number
  specularType: number

  // Glass tint
  glassTintR: number
  glassTintG: number
  glassTintB: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number

  // Icon
  iconType: number
  iconOpacity: number
  iconScale: number
  iconColorR: number
  iconColorG: number
  iconColorB: number

  // Chromatic aberration
  chromaticAberration: boolean
  chromaticStrength: number
  chromaticBase: number

  // Layer & state
  layerIndex: number
  isActive: boolean
}

export const DEFAULT_CIRCLE_INSTANCE_CONFIG: CircleInstanceConfig = {
  centerX: 0.5,
  centerY: 0.5,
  size: 1.0,
  shapeType: 0,
  rectWidth: 200,
  rectHeight: 100,
  rectRadius: 50,
  surfaceType: 0,
  bezelWidth: 48,
  glassThickness: 8,
  refractiveIndex: 1.2,
  magnifyingScale: 0,
  scaleRatio: 1.0,
  maxDisplacementScale: 3.0,
  shadowOpacity: 0.25,
  shadowBlur: 24,
  shadowOffsetX: 0,
  shadowOffsetY: 8,
  blurAmount: 0,
  blurType: 0,
  progressiveBlur: 0,
  progressiveBlurType: 0,
  specularOpacity: 0.65,
  specularAngle: 135 * Math.PI / 180,
  specularSaturation: 1.2,
  specularType: 0,
  glassTintR: 1.0,
  glassTintG: 1.0,
  glassTintB: 1.0,
  glassBgOpacity: 0,
  pressedGlassBgOpacity: 0,
  iconType: 0,
  iconOpacity: 1.0,
  iconScale: 0.5,
  iconColorR: 1.0,
  iconColorG: 1.0,
  iconColorB: 1.0,
  chromaticAberration: false,
  chromaticStrength: 0.15,
  chromaticBase: 1.0,
  layerIndex: 0,
  isActive: false,
}

// Storage buffer layout: 64 floats per instance (256 bytes, aligned to 16)
export const CIRCLE_INSTANCE_FLOATS = 64
export const CIRCLE_INSTANCE_BYTES = CIRCLE_INSTANCE_FLOATS * 4
export const MAX_CIRCLE_INSTANCES = 8
export const CIRCLE_INSTANCES_BUFFER_SIZE = CIRCLE_INSTANCE_BYTES * MAX_CIRCLE_INSTANCES

export class CircleInstance {
  private device: GPUDevice
  private textureLoader: BackgroundTextureLoader
  private iconRequestId = 0
  private _iconTexture: GPUTexture
  private _iconUrl: string | null = null
  private onTextureChange: () => void

  // All configurable properties
  centerX: number
  centerY: number
  size: number
  shapeType: number
  rectWidth: number
  rectHeight: number
  rectRadius: number
  surfaceType: number
  bezelWidth: number
  glassThickness: number
  refractiveIndex: number
  magnifyingScale: number
  scaleRatio: number
  maxDisplacementScale: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  blurAmount: number
  blurType: number
  progressiveBlur: number
  progressiveBlurType: number
  specularOpacity: number
  specularAngle: number
  specularSaturation: number
  specularType: number
  glassTintR: number
  glassTintG: number
  glassTintB: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number
  iconType: number
  iconOpacity: number
  iconScale: number
  iconColorR: number
  iconColorG: number
  iconColorB: number
  chromaticAberration: boolean
  chromaticStrength: number
  chromaticBase: number
  layerIndex: number
  isActive: boolean

  // Runtime state (from springs)
  scaleX = 1.0
  scaleY = 1.0
  runtimeGlassBgOpacity: number | null = null // null means use glassBgOpacity

  constructor(
    device: GPUDevice,
    textureLoader: BackgroundTextureLoader,
    emptyTexture: GPUTexture,
    config: Partial<CircleInstanceConfig> = {},
    onTextureChange: () => void
  ) {
    this.device = device
    this.textureLoader = textureLoader
    this._iconTexture = emptyTexture
    this.onTextureChange = onTextureChange

    // Apply defaults then override with config
    const fullConfig = { ...DEFAULT_CIRCLE_INSTANCE_CONFIG, ...config }
    this.centerX = fullConfig.centerX
    this.centerY = fullConfig.centerY
    this.size = fullConfig.size
    this.shapeType = fullConfig.shapeType
    this.rectWidth = fullConfig.rectWidth
    this.rectHeight = fullConfig.rectHeight
    this.rectRadius = fullConfig.rectRadius
    this.surfaceType = fullConfig.surfaceType
    this.bezelWidth = fullConfig.bezelWidth
    this.glassThickness = fullConfig.glassThickness
    this.refractiveIndex = fullConfig.refractiveIndex
    this.magnifyingScale = fullConfig.magnifyingScale
    this.scaleRatio = fullConfig.scaleRatio
    this.maxDisplacementScale = fullConfig.maxDisplacementScale
    this.shadowOpacity = fullConfig.shadowOpacity
    this.shadowBlur = fullConfig.shadowBlur
    this.shadowOffsetX = fullConfig.shadowOffsetX
    this.shadowOffsetY = fullConfig.shadowOffsetY
    this.blurAmount = fullConfig.blurAmount
    this.blurType = fullConfig.blurType
    this.progressiveBlur = fullConfig.progressiveBlur
    this.progressiveBlurType = fullConfig.progressiveBlurType
    this.specularOpacity = fullConfig.specularOpacity
    this.specularAngle = fullConfig.specularAngle
    this.specularSaturation = fullConfig.specularSaturation
    this.specularType = fullConfig.specularType
    this.glassTintR = fullConfig.glassTintR
    this.glassTintG = fullConfig.glassTintG
    this.glassTintB = fullConfig.glassTintB
    this.glassBgOpacity = fullConfig.glassBgOpacity
    this.pressedGlassBgOpacity = fullConfig.pressedGlassBgOpacity
    this.iconType = fullConfig.iconType
    this.iconOpacity = fullConfig.iconOpacity
    this.iconScale = fullConfig.iconScale
    this.iconColorR = fullConfig.iconColorR
    this.iconColorG = fullConfig.iconColorG
    this.iconColorB = fullConfig.iconColorB
    this.chromaticAberration = fullConfig.chromaticAberration
    this.chromaticStrength = fullConfig.chromaticStrength
    this.chromaticBase = fullConfig.chromaticBase
    this.layerIndex = fullConfig.layerIndex
    this.isActive = fullConfig.isActive
  }

  get iconTexture(): GPUTexture {
    return this._iconTexture
  }

  get iconUrl(): string | null {
    return this._iconUrl
  }

  async setIcon(url: string | null): Promise<void> {
    const requestId = ++this.iconRequestId
    this._iconUrl = url

    if (!url) {
      this._iconTexture = this.createEmptyTexture()
      this.onTextureChange()
      return
    }

    const texture = await this.textureLoader.load(url)
    if (requestId !== this.iconRequestId) return

    this._iconTexture = texture
    this.onTextureChange()
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

  copyFrom(other: CircleInstance): void {
    this.size = other.size
    this.shapeType = other.shapeType
    this.rectWidth = other.rectWidth
    this.rectHeight = other.rectHeight
    this.rectRadius = other.rectRadius
    this.surfaceType = other.surfaceType
    this.bezelWidth = other.bezelWidth
    this.glassThickness = other.glassThickness
    this.refractiveIndex = other.refractiveIndex
    this.magnifyingScale = other.magnifyingScale
    this.scaleRatio = other.scaleRatio
    this.maxDisplacementScale = other.maxDisplacementScale
    this.shadowOpacity = other.shadowOpacity
    this.shadowBlur = other.shadowBlur
    this.shadowOffsetX = other.shadowOffsetX
    this.shadowOffsetY = other.shadowOffsetY
    this.blurAmount = other.blurAmount
    this.blurType = other.blurType
    this.progressiveBlur = other.progressiveBlur
    this.progressiveBlurType = other.progressiveBlurType
    this.specularOpacity = other.specularOpacity
    this.specularAngle = other.specularAngle
    this.specularSaturation = other.specularSaturation
    this.specularType = other.specularType
    this.glassTintR = other.glassTintR
    this.glassTintG = other.glassTintG
    this.glassTintB = other.glassTintB
    this.glassBgOpacity = other.glassBgOpacity
    this.pressedGlassBgOpacity = other.pressedGlassBgOpacity
    this.iconType = other.iconType
    this.iconOpacity = other.iconOpacity
    this.iconScale = other.iconScale
    this.iconColorR = other.iconColorR
    this.iconColorG = other.iconColorG
    this.iconColorB = other.iconColorB
    this.chromaticAberration = other.chromaticAberration
    this.chromaticStrength = other.chromaticStrength
    this.chromaticBase = other.chromaticBase
    this.layerIndex = other.layerIndex
    // Don't copy: centerX, centerY, isActive, scaleX, scaleY, icon
  }

  toBufferData(canvasWidth: number, canvasHeight: number, dpr: number): Float32Array {
    const data = new Float32Array(CIRCLE_INSTANCE_FLOATS)
    let i = 0

    // Position & size (4 floats)
    data[i++] = this.centerX * canvasWidth
    data[i++] = this.centerY * canvasHeight
    data[i++] = this.size
    data[i++] = this.shapeType

    // Rect dimensions (4 floats)
    data[i++] = this.rectWidth * dpr
    data[i++] = this.rectHeight * dpr
    data[i++] = this.rectRadius * dpr
    data[i++] = 0 // padding

    // Surface & refraction (8 floats)
    data[i++] = this.surfaceType
    data[i++] = this.bezelWidth
    data[i++] = this.glassThickness
    data[i++] = this.refractiveIndex
    data[i++] = this.magnifyingScale
    data[i++] = this.scaleRatio
    data[i++] = this.maxDisplacementScale
    data[i++] = 0 // padding

    // Shadow (4 floats)
    data[i++] = this.shadowOpacity
    data[i++] = this.shadowBlur
    data[i++] = this.shadowOffsetX
    data[i++] = this.shadowOffsetY

    // Blur (4 floats)
    data[i++] = this.blurAmount
    data[i++] = this.blurType
    data[i++] = this.progressiveBlur
    data[i++] = this.progressiveBlurType

    // Specular (4 floats)
    data[i++] = this.specularOpacity
    data[i++] = this.specularAngle
    data[i++] = this.specularSaturation
    data[i++] = this.specularType

    // Glass tint (4 floats)
    data[i++] = this.glassTintR
    data[i++] = this.glassTintG
    data[i++] = this.glassTintB
    data[i++] = this.runtimeGlassBgOpacity ?? this.glassBgOpacity

    // Icon (8 floats)
    data[i++] = this.iconType
    data[i++] = this.iconOpacity
    data[i++] = this.iconScale
    data[i++] = this.iconColorR
    data[i++] = this.iconColorG
    data[i++] = this.iconColorB
    data[i++] = 0 // padding
    data[i++] = 0 // padding

    // Chromatic aberration (4 floats)
    data[i++] = this.chromaticAberration ? 1.0 : 0.0
    data[i++] = this.chromaticStrength
    data[i++] = this.chromaticBase
    data[i++] = 0 // padding

    // Layer & state (4 floats)
    data[i++] = this.layerIndex
    data[i++] = this.isActive ? 1.0 : 0.0
    data[i++] = this.scaleX
    data[i++] = this.scaleY

    // Extra properties (4 floats)
    data[i++] = this.pressedGlassBgOpacity
    data[i++] = 0 // padding
    data[i++] = 0 // padding
    data[i++] = 0 // padding

    // Remaining padding to reach 64 floats
    // Already at 52, need 12 more
    while (i < CIRCLE_INSTANCE_FLOATS) {
      data[i++] = 0
    }

    return data
  }
}
