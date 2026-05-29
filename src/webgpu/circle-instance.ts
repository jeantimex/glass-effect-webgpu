import type { BackgroundTextureLoader } from './texture-loader'
import {
  GlassInstance,
  DEFAULT_GLASS_INSTANCE_CONFIG,
  type GlassInstanceConfig,
} from './glass-instance'

export interface CircleInstanceConfig extends GlassInstanceConfig {
  size: number
  // Icon properties - only for circles
  iconType: number
  iconOpacity: number
  iconScale: number
  iconColorR: number
  iconColorG: number
  iconColorB: number
}

export const DEFAULT_CIRCLE_INSTANCE_CONFIG: CircleInstanceConfig = {
  ...DEFAULT_GLASS_INSTANCE_CONFIG,
  shapeType: 0,
  size: 1.0,
  iconType: 0,
  iconOpacity: 1.0,
  iconScale: 0.5,
  iconColorR: 1.0,
  iconColorG: 1.0,
  iconColorB: 1.0,
}

export class CircleInstance extends GlassInstance {
  readonly shapeType = 0
  size: number

  // Icon properties - only circles have icons
  private iconRequestId = 0
  private _iconTexture: GPUTexture
  private _iconUrl: string | null = null
  iconType: number
  iconOpacity: number
  iconScale: number
  iconColorR: number
  iconColorG: number
  iconColorB: number

  constructor(
    device: GPUDevice,
    textureLoader: BackgroundTextureLoader,
    emptyTexture: GPUTexture,
    config: Partial<CircleInstanceConfig> = {},
    onTextureChange: () => void
  ) {
    super(device, textureLoader, emptyTexture, config, onTextureChange)
    const fullConfig = { ...DEFAULT_CIRCLE_INSTANCE_CONFIG, ...config }
    this.size = fullConfig.size
    this._iconTexture = emptyTexture
    this.iconType = fullConfig.iconType
    this.iconOpacity = fullConfig.iconOpacity
    this.iconScale = fullConfig.iconScale
    this.iconColorR = fullConfig.iconColorR
    this.iconColorG = fullConfig.iconColorG
    this.iconColorB = fullConfig.iconColorB
  }

  override get iconTexture(): GPUTexture {
    return this._iconTexture
  }

  override get iconUrl(): string | null {
    return this._iconUrl
  }

  override async setIcon(url: string | null): Promise<void> {
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

  getEffectiveRadius(canvasWidth: number, canvasHeight: number, _dpr: number): number {
    const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.35
    return baseRadius * this.size
  }

  getHalfDimensions(canvasWidth: number, canvasHeight: number, dpr: number): { width: number; height: number } {
    const radius = this.getEffectiveRadius(canvasWidth, canvasHeight, dpr)
    return { width: radius, height: radius }
  }

  protected writeShapeSpecificData(data: Float32Array, index: number, _dpr: number): number {
    // Update size in position block (index 2)
    data[2] = this.size

    // Rect dimensions (4 floats) - not used for circles, write zeros
    data[index++] = 0 // rectWidth
    data[index++] = 0 // rectHeight
    data[index++] = 0 // rectRadius
    data[index++] = 0 // padding
    return index
  }

  protected override getIconBufferData() {
    return {
      iconType: this.iconType,
      iconOpacity: this.iconOpacity,
      iconScale: this.iconScale,
      iconColorR: this.iconColorR,
      iconColorG: this.iconColorG,
      iconColorB: this.iconColorB,
    }
  }

  copyFrom(other: CircleInstance): void {
    this.copyFromBase(other)
    this.size = other.size
    this.iconType = other.iconType
    this.iconOpacity = other.iconOpacity
    this.iconScale = other.iconScale
    this.iconColorR = other.iconColorR
    this.iconColorG = other.iconColorG
    this.iconColorB = other.iconColorB
  }
}

// Re-export constants from glass-instance for backwards compatibility
export {
  GLASS_INSTANCE_FLOATS as CIRCLE_INSTANCE_FLOATS,
  GLASS_INSTANCE_BYTES as CIRCLE_INSTANCE_BYTES,
  MAX_GLASS_INSTANCES as MAX_CIRCLE_INSTANCES,
  GLASS_INSTANCES_BUFFER_SIZE as CIRCLE_INSTANCES_BUFFER_SIZE,
} from './glass-instance'
