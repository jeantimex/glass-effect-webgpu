import type { BackgroundTextureLoader } from './texture-loader'

export interface GlassInstanceConfig {
  // Position
  centerX: number
  centerY: number

  // Shape type: 0 = circle, 1 = rect
  shapeType: number

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
  specularThickness: number
  specularBlur: number
  specularAngle: number
  specularSaturation: number
  specularType: number

  // Glass tint
  glassTintR: number
  glassTintG: number
  glassTintB: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number

  // Chromatic aberration
  chromaticAberration: boolean
  chromaticStrength: number
  chromaticBase: number

  // Layer & state
  layerIndex: number
  isActive: boolean
}

export const DEFAULT_GLASS_INSTANCE_CONFIG: GlassInstanceConfig = {
  centerX: 0.5,
  centerY: 0.5,
  shapeType: 0,
  surfaceType: 0,
  bezelWidth: 45,
  glassThickness: 10,
  refractiveIndex: 1.5,
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
  specularOpacity: 0.8,
  specularThickness: 2,
  specularBlur: 2,
  specularAngle: 135 * Math.PI / 180,
  specularSaturation: 1.2,
  specularType: 0,
  glassTintR: 1.0,
  glassTintG: 1.0,
  glassTintB: 1.0,
  glassBgOpacity: 0,
  pressedGlassBgOpacity: 0,
  chromaticAberration: true,
  chromaticStrength: 0.2,
  chromaticBase: 1.0,
  layerIndex: 0,
  isActive: false,
}

// Storage buffer layout: 64 floats per instance (256 bytes, aligned to 16)
export const GLASS_INSTANCE_FLOATS = 64
export const GLASS_INSTANCE_BYTES = GLASS_INSTANCE_FLOATS * 4
export const MAX_GLASS_INSTANCES = 8
export const GLASS_INSTANCES_BUFFER_SIZE = GLASS_INSTANCE_BYTES * MAX_GLASS_INSTANCES

export abstract class GlassInstance {
  protected device: GPUDevice
  protected textureLoader: BackgroundTextureLoader
  protected _emptyTexture: GPUTexture
  protected onTextureChange: () => void

  // Position
  centerX: number
  centerY: number

  // Shape type
  abstract readonly shapeType: number

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
  specularThickness: number
  specularBlur: number
  specularAngle: number
  specularSaturation: number
  specularType: number

  // Glass tint
  glassTintR: number
  glassTintG: number
  glassTintB: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number

  // Chromatic aberration
  chromaticAberration: boolean
  chromaticStrength: number
  chromaticBase: number

  // Layer & state
  layerIndex: number
  isActive: boolean

  // Runtime state (from springs)
  scaleX = 1.0
  scaleY = 1.0
  runtimeGlassBgOpacity: number | null = null

  constructor(
    device: GPUDevice,
    textureLoader: BackgroundTextureLoader,
    emptyTexture: GPUTexture,
    config: Partial<GlassInstanceConfig>,
    onTextureChange: () => void
  ) {
    this.device = device
    this.textureLoader = textureLoader
    this._emptyTexture = emptyTexture
    this.onTextureChange = onTextureChange

    const fullConfig = { ...DEFAULT_GLASS_INSTANCE_CONFIG, ...config }
    this.centerX = fullConfig.centerX
    this.centerY = fullConfig.centerY
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
    this.specularThickness = fullConfig.specularThickness
    this.specularBlur = fullConfig.specularBlur
    this.specularAngle = fullConfig.specularAngle
    this.specularSaturation = fullConfig.specularSaturation
    this.specularType = fullConfig.specularType
    this.glassTintR = fullConfig.glassTintR
    this.glassTintG = fullConfig.glassTintG
    this.glassTintB = fullConfig.glassTintB
    this.glassBgOpacity = fullConfig.glassBgOpacity
    this.pressedGlassBgOpacity = fullConfig.pressedGlassBgOpacity
    this.chromaticAberration = fullConfig.chromaticAberration
    this.chromaticStrength = fullConfig.chromaticStrength
    this.chromaticBase = fullConfig.chromaticBase
    this.layerIndex = fullConfig.layerIndex
    this.isActive = fullConfig.isActive
  }

  // Icon support - only CircleInstance has icons
  get iconTexture(): GPUTexture {
    return this._emptyTexture
  }

  get iconUrl(): string | null {
    return null
  }

  async setIcon(_url: string | null): Promise<void> {
    // No-op for base class - only CircleInstance supports icons
  }

  protected createEmptyTexture(): GPUTexture {
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

  copyFromBase(other: GlassInstance): void {
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
    this.specularThickness = other.specularThickness
    this.specularBlur = other.specularBlur
    this.specularAngle = other.specularAngle
    this.specularSaturation = other.specularSaturation
    this.specularType = other.specularType
    this.glassTintR = other.glassTintR
    this.glassTintG = other.glassTintG
    this.glassTintB = other.glassTintB
    this.glassBgOpacity = other.glassBgOpacity
    this.pressedGlassBgOpacity = other.pressedGlassBgOpacity
    this.chromaticAberration = other.chromaticAberration
    this.chromaticStrength = other.chromaticStrength
    this.chromaticBase = other.chromaticBase
    this.layerIndex = other.layerIndex
  }

  abstract getEffectiveRadius(canvasWidth: number, canvasHeight: number, dpr: number): number
  abstract getHalfDimensions(canvasWidth: number, canvasHeight: number, dpr: number): { width: number; height: number }

  // Icon data for buffer - subclasses override to provide actual values
  protected getIconBufferData(): { iconType: number; iconOpacity: number; iconScale: number; iconColorR: number; iconColorG: number; iconColorB: number } {
    return { iconType: 0, iconOpacity: 0, iconScale: 0, iconColorR: 0, iconColorG: 0, iconColorB: 0 }
  }

  toBufferData(canvasWidth: number, canvasHeight: number, dpr: number): Float32Array {
    const data = new Float32Array(GLASS_INSTANCE_FLOATS)
    this.writeToBuffer(data, canvasWidth, canvasHeight, dpr)
    return data
  }

  protected abstract writeShapeSpecificData(data: Float32Array, index: number, dpr: number): number

  protected writeToBuffer(data: Float32Array, canvasWidth: number, canvasHeight: number, dpr: number): void {
    let i = 0

    // Position & shape type (4 floats)
    data[i++] = this.centerX * canvasWidth
    data[i++] = this.centerY * canvasHeight
    data[i++] = 0 // Will be set by subclass (size for circle, unused for rect)
    data[i++] = this.shapeType

    // Shape-specific data (4 floats) - handled by subclass
    i = this.writeShapeSpecificData(data, i, dpr)

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

    // Icon (8 floats) - get from subclass
    const iconData = this.getIconBufferData()
    data[i++] = iconData.iconType
    data[i++] = iconData.iconOpacity
    data[i++] = iconData.iconScale
    data[i++] = iconData.iconColorR
    data[i++] = iconData.iconColorG
    data[i++] = iconData.iconColorB
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
    data[i++] = this.specularThickness
    data[i++] = this.specularBlur
    data[i++] = 0 // padding

    // Remaining padding to reach 64 floats
    while (i < GLASS_INSTANCE_FLOATS) {
      data[i++] = 0
    }
  }
}
