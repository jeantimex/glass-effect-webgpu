import type { BackgroundTextureLoader } from './texture-loader'
import {
  GlassInstance,
  DEFAULT_GLASS_INSTANCE_CONFIG,
  type GlassInstanceConfig,
} from './glass-instance'

export interface RectangleInstanceConfig extends GlassInstanceConfig {
  rectWidth: number
  rectHeight: number
  rectRadius: number
}

export const DEFAULT_RECTANGLE_INSTANCE_CONFIG: RectangleInstanceConfig = {
  ...DEFAULT_GLASS_INSTANCE_CONFIG,
  shapeType: 1,
  rectWidth: 200,
  rectHeight: 100,
  rectRadius: 100,
}

export class RectangleInstance extends GlassInstance {
  readonly shapeType = 1
  rectWidth: number
  rectHeight: number
  rectRadius: number

  constructor(
    device: GPUDevice,
    textureLoader: BackgroundTextureLoader,
    emptyTexture: GPUTexture,
    config: Partial<RectangleInstanceConfig> = {},
    onTextureChange: () => void
  ) {
    super(device, textureLoader, emptyTexture, config, onTextureChange)
    const fullConfig = { ...DEFAULT_RECTANGLE_INSTANCE_CONFIG, ...config }
    this.rectWidth = fullConfig.rectWidth
    this.rectHeight = fullConfig.rectHeight
    this.rectRadius = fullConfig.rectRadius
  }

  getEffectiveRadius(_canvasWidth: number, _canvasHeight: number, dpr: number): number {
    return Math.max(this.rectWidth, this.rectHeight) * dpr * 0.5
  }

  getHalfDimensions(_canvasWidth: number, _canvasHeight: number, dpr: number): { width: number; height: number } {
    return {
      width: this.rectWidth * dpr * 0.5,
      height: this.rectHeight * dpr * 0.5,
    }
  }

  protected writeShapeSpecificData(data: Float32Array, index: number, dpr: number): number {
    // Size field (index 2) is set to 1.0 for rectangles (used as scale multiplier)
    data[2] = 1.0

    // Rect dimensions (4 floats)
    data[index++] = this.rectWidth * dpr
    data[index++] = this.rectHeight * dpr
    data[index++] = this.rectRadius * dpr
    data[index++] = 0 // padding
    return index
  }

  copyFrom(other: RectangleInstance): void {
    this.copyFromBase(other)
    this.rectWidth = other.rectWidth
    this.rectHeight = other.rectHeight
    this.rectRadius = other.rectRadius
  }
}
