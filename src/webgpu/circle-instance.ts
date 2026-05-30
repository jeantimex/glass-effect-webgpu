import type { BackgroundTextureLoader } from './texture-loader'
import {
  GlassInstance,
  DEFAULT_GLASS_INSTANCE_CONFIG,
  type GlassInstanceConfig,
} from './glass-instance'

export interface CircleInstanceConfig extends GlassInstanceConfig {
  size: number
}

export const DEFAULT_CIRCLE_INSTANCE_CONFIG: CircleInstanceConfig = {
  ...DEFAULT_GLASS_INSTANCE_CONFIG,
  shapeType: 0,
  size: 0.8,
}

export class CircleInstance extends GlassInstance {
  readonly shapeType = 0
  size: number

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

  copyFrom(other: CircleInstance): void {
    this.copyFromBase(other)
    this.size = other.size
  }
}

// Re-export constants from glass-instance for backwards compatibility
export {
  GLASS_INSTANCE_FLOATS as CIRCLE_INSTANCE_FLOATS,
  GLASS_INSTANCE_BYTES as CIRCLE_INSTANCE_BYTES,
  MAX_GLASS_INSTANCES as MAX_CIRCLE_INSTANCES,
  GLASS_INSTANCES_BUFFER_SIZE as CIRCLE_INSTANCES_BUFFER_SIZE,
} from './glass-instance'
