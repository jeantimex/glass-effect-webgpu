import type { BackgroundTextureLoader } from './texture-loader'

export interface CircleConfig {
  size: number
  iconUrl: string | null
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
}

export interface CircleParams {
  centerX: number
  centerY: number
  size: number
  iconTexture: GPUTexture
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  scaleX: number
  scaleY: number
}

export class Circle {
  private device: GPUDevice
  private textureLoader: BackgroundTextureLoader
  private iconRequestId = 0
  private _iconTexture: GPUTexture
  private _iconUrl: string | null = null
  private onTextureChange: () => void

  centerX = 0.5
  centerY = 0.5
  size: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  scaleX = 1
  scaleY = 1

  constructor(
    device: GPUDevice,
    textureLoader: BackgroundTextureLoader,
    emptyTexture: GPUTexture,
    config: CircleConfig,
    onTextureChange: () => void
  ) {
    this.device = device
    this.textureLoader = textureLoader
    this._iconTexture = emptyTexture
    this.size = config.size
    this.shadowOpacity = config.shadowOpacity
    this.shadowBlur = config.shadowBlur
    this.shadowOffsetX = config.shadowOffsetX
    this.shadowOffsetY = config.shadowOffsetY
    this.onTextureChange = onTextureChange

    if (config.iconUrl) {
      this.setIcon(config.iconUrl)
    }
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

  getParams(): CircleParams {
    return {
      centerX: this.centerX,
      centerY: this.centerY,
      size: this.size,
      iconTexture: this._iconTexture,
      shadowOpacity: this.shadowOpacity,
      shadowBlur: this.shadowBlur,
      shadowOffsetX: this.shadowOffsetX,
      shadowOffsetY: this.shadowOffsetY,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
    }
  }

  applyConfig(config: Partial<CircleConfig>): void {
    if (config.size !== undefined) this.size = config.size
    if (config.shadowOpacity !== undefined) this.shadowOpacity = config.shadowOpacity
    if (config.shadowBlur !== undefined) this.shadowBlur = config.shadowBlur
    if (config.shadowOffsetX !== undefined) this.shadowOffsetX = config.shadowOffsetX
    if (config.shadowOffsetY !== undefined) this.shadowOffsetY = config.shadowOffsetY
    if (config.iconUrl !== undefined) this.setIcon(config.iconUrl)
  }
}
