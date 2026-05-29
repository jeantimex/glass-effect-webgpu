import {
  CircleInstance,
  CIRCLE_INSTANCE_FLOATS,
  CIRCLE_INSTANCES_BUFFER_SIZE,
  MAX_CIRCLE_INSTANCES,
  DEFAULT_CIRCLE_INSTANCE_CONFIG,
  type CircleInstanceConfig,
} from './circle-instance'
import type { BackgroundTextureLoader } from './texture-loader'

export class CircleInstanceManager {
  private device: GPUDevice
  private textureLoader: BackgroundTextureLoader
  private emptyTexture: GPUTexture
  private onTextureChange: () => void
  private _instances: CircleInstance[] = []
  private _activeIndex = 0
  private _storageBuffer: GPUBuffer
  private _strategy: number = 0 // 0 = stack, 1 = merge

  constructor(
    device: GPUDevice,
    textureLoader: BackgroundTextureLoader,
    emptyTexture: GPUTexture,
    onTextureChange: () => void
  ) {
    this.device = device
    this.textureLoader = textureLoader
    this.emptyTexture = emptyTexture
    this.onTextureChange = onTextureChange

    this._storageBuffer = device.createBuffer({
      size: CIRCLE_INSTANCES_BUFFER_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    // Start with one default instance
    this.reset()
  }

  get instances(): readonly CircleInstance[] {
    return this._instances
  }

  get count(): number {
    return this._instances.length
  }

  get activeIndex(): number {
    return this._activeIndex
  }

  get activeInstance(): CircleInstance | undefined {
    return this._instances[this._activeIndex]
  }

  get storageBuffer(): GPUBuffer {
    return this._storageBuffer
  }

  get strategy(): number {
    return this._strategy
  }

  set strategy(value: number) {
    this._strategy = value
  }

  setActiveIndex(index: number): void {
    const clampedIndex = Math.max(0, Math.min(index, this._instances.length - 1))

    // Update isActive flags
    for (let i = 0; i < this._instances.length; i++) {
      this._instances[i].isActive = i === clampedIndex
    }

    this._activeIndex = clampedIndex
  }

  getInstance(index: number): CircleInstance | undefined {
    return this._instances[index]
  }

  reset(initialConfig?: Partial<CircleInstanceConfig>): void {
    this._instances = []
    this._activeIndex = 0
    this.addInstance({
      ...DEFAULT_CIRCLE_INSTANCE_CONFIG,
      ...initialConfig,
      centerX: 0.5,
      centerY: 0.5,
      isActive: true,
    })
  }

  addInstance(config?: Partial<CircleInstanceConfig>): number {
    if (this._instances.length >= MAX_CIRCLE_INSTANCES) {
      return this._instances.length - 1
    }

    const index = this._instances.length

    // Copy properties from active instance if exists, else use defaults
    const baseConfig = this._instances[this._activeIndex]
      ? this.extractConfig(this._instances[this._activeIndex])
      : DEFAULT_CIRCLE_INSTANCE_CONFIG

    // Calculate new position
    const newPosition = this.calculateNewPosition(index)

    const instance = new CircleInstance(
      this.device,
      this.textureLoader,
      this.emptyTexture,
      {
        ...baseConfig,
        ...newPosition,
        ...config,
        isActive: false,
      },
      this.onTextureChange
    )

    // Copy icon from active instance if it has one
    const activeInstance = this._instances[this._activeIndex]
    if (activeInstance?.iconUrl) {
      void instance.setIcon(activeInstance.iconUrl)
    }

    this._instances.push(instance)
    this.setActiveIndex(index)

    return index
  }

  removeInstance(index: number): boolean {
    if (this._instances.length <= 1 || index < 0 || index >= this._instances.length) {
      return false
    }

    this._instances.splice(index, 1)

    // Adjust active index if needed
    if (this._activeIndex >= this._instances.length) {
      this._activeIndex = this._instances.length - 1
    }
    this.setActiveIndex(this._activeIndex)

    return true
  }

  async setIconForAll(url: string | null): Promise<void> {
    await Promise.all(this._instances.map((instance) => instance.setIcon(url)))
  }

  async setIconForActive(url: string | null): Promise<void> {
    const active = this.activeInstance
    if (active) {
      await active.setIcon(url)
    }
  }

  getClickedInstanceIndex(
    canvasWidth: number,
    canvasHeight: number,
    pointX: number,
    pointY: number,
    dpr: number
  ): number {
    let closestIndex = -1
    let closestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < this._instances.length; i++) {
      const instance = this._instances[i]
      const centerX = instance.centerX * canvasWidth
      const centerY = instance.centerY * canvasHeight
      const distance = this.calculateInstanceDistance(
        instance,
        pointX,
        pointY,
        centerX,
        centerY,
        canvasWidth,
        canvasHeight,
        dpr
      )

      const hitDistance = this._strategy === 1 ? distance - 4 : distance
      if (hitDistance <= 0 && distance < closestDistance) {
        closestIndex = i
        closestDistance = distance
      }
    }

    return closestIndex
  }

  private calculateInstanceDistance(
    instance: CircleInstance,
    pointX: number,
    pointY: number,
    centerX: number,
    centerY: number,
    canvasWidth: number,
    canvasHeight: number,
    dpr: number
  ): number {
    if (instance.shapeType === 1) {
      // Rounded rect distance
      const rectWidth = instance.rectWidth * dpr * instance.size
      const rectHeight = instance.rectHeight * dpr * instance.size
      const rectRadius = Math.min(instance.rectRadius * dpr, Math.min(rectWidth, rectHeight) * 0.5) * instance.size
      return this.roundedRectDistance(
        pointX - centerX,
        pointY - centerY,
        rectWidth,
        rectHeight,
        rectRadius
      )
    } else {
      // Circle distance
      const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.35
      return Math.hypot(pointX - centerX, pointY - centerY) - baseRadius * instance.size
    }
  }

  private roundedRectDistance(
    px: number,
    py: number,
    width: number,
    height: number,
    radius: number
  ): number {
    const qx = Math.abs(px) - width * 0.5 + radius
    const qy = Math.abs(py) - height * 0.5 + radius
    const outside = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2)
    const inside = Math.min(Math.max(qx, qy), 0)
    return outside + inside - radius
  }

  getDragOffset(index: number, canvasWidth: number, canvasHeight: number, pointX: number, pointY: number): { x: number; y: number } {
    const instance = this._instances[index]
    if (!instance) return { x: 0, y: 0 }
    return {
      x: pointX - instance.centerX * canvasWidth,
      y: pointY - instance.centerY * canvasHeight,
    }
  }

  setInstancePositionFromPoint(
    index: number,
    canvasWidth: number,
    canvasHeight: number,
    pointX: number,
    pointY: number,
    dragOffset: { x: number; y: number } = { x: 0, y: 0 },
    dpr: number
  ): void {
    const instance = this._instances[index]
    if (!instance) return

    const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.35
    const radius = baseRadius * instance.size

    const rectHalfWidth = instance.shapeType === 1
      ? instance.rectWidth * dpr * instance.size * 0.5
      : radius
    const rectHalfHeight = instance.shapeType === 1
      ? instance.rectHeight * dpr * instance.size * 0.5
      : radius

    const minX = rectHalfWidth
    const maxX = canvasWidth - rectHalfWidth
    const minY = rectHalfHeight
    const maxY = canvasHeight - rectHalfHeight

    instance.centerX = Math.min(Math.max(pointX - dragOffset.x, minX), maxX) / canvasWidth
    instance.centerY = Math.min(Math.max(pointY - dragOffset.y, minY), maxY) / canvasHeight
  }

  private calculateNewPosition(index: number): { centerX: number; centerY: number } {
    if (index === 0) {
      return { centerX: 0.5, centerY: 0.5 }
    }

    const previous = this._instances[index - 1] ?? this._instances[0]
    let centerX = previous?.centerX ?? 0.5
    let centerY = previous?.centerY ?? 0.5

    if (this._strategy === 0) {
      // Stack strategy: offset vertically
      const verticalStep = 0.08
      centerY = Math.min(centerY + verticalStep, 0.9)
    } else {
      // Merge strategy: spread horizontally
      const pair = Math.max(1, Math.floor(index / 2) + 1)
      const direction = index % 2 === 0 ? -1 : 1
      const horizontalStep = 0.12 * pair
      const verticalStep = 0.08 * pair
      centerX = Math.min(Math.max(0.5 + direction * horizontalStep, 0.1), 0.9)
      centerY = Math.min(Math.max(0.5 + verticalStep * (index % 4 === 0 ? -1 : 1), 0.1), 0.9)
    }

    return { centerX, centerY }
  }

  private extractConfig(instance: CircleInstance): CircleInstanceConfig {
    return {
      centerX: instance.centerX,
      centerY: instance.centerY,
      size: instance.size,
      shapeType: instance.shapeType,
      rectWidth: instance.rectWidth,
      rectHeight: instance.rectHeight,
      rectRadius: instance.rectRadius,
      surfaceType: instance.surfaceType,
      bezelWidth: instance.bezelWidth,
      glassThickness: instance.glassThickness,
      refractiveIndex: instance.refractiveIndex,
      magnifyingScale: instance.magnifyingScale,
      scaleRatio: instance.scaleRatio,
      maxDisplacementScale: instance.maxDisplacementScale,
      shadowOpacity: instance.shadowOpacity,
      shadowBlur: instance.shadowBlur,
      shadowOffsetX: instance.shadowOffsetX,
      shadowOffsetY: instance.shadowOffsetY,
      blurAmount: instance.blurAmount,
      blurType: instance.blurType,
      progressiveBlur: instance.progressiveBlur,
      progressiveBlurType: instance.progressiveBlurType,
      specularOpacity: instance.specularOpacity,
      specularAngle: instance.specularAngle,
      specularSaturation: instance.specularSaturation,
      specularType: instance.specularType,
      glassTintR: instance.glassTintR,
      glassTintG: instance.glassTintG,
      glassTintB: instance.glassTintB,
      glassBgOpacity: instance.glassBgOpacity,
      pressedGlassBgOpacity: instance.pressedGlassBgOpacity,
      iconType: instance.iconType,
      iconOpacity: instance.iconOpacity,
      iconScale: instance.iconScale,
      iconColorR: instance.iconColorR,
      iconColorG: instance.iconColorG,
      iconColorB: instance.iconColorB,
      chromaticAberration: instance.chromaticAberration,
      chromaticStrength: instance.chromaticStrength,
      chromaticBase: instance.chromaticBase,
      layerIndex: instance.layerIndex,
      isActive: instance.isActive,
    }
  }

  updateStorageBuffer(canvasWidth: number, canvasHeight: number, dpr: number): void {
    const fullData = new Float32Array(CIRCLE_INSTANCE_FLOATS * MAX_CIRCLE_INSTANCES)

    for (let i = 0; i < this._instances.length; i++) {
      const instanceData = this._instances[i].toBufferData(canvasWidth, canvasHeight, dpr)
      fullData.set(instanceData, i * CIRCLE_INSTANCE_FLOATS)
    }

    this.device.queue.writeBuffer(this._storageBuffer, 0, fullData)
  }

  writeSingleInstanceToBuffer(
    instance: CircleInstance,
    canvasWidth: number,
    canvasHeight: number,
    dpr: number,
    bufferIndex: number = 0
  ): void {
    const instanceData = instance.toBufferData(canvasWidth, canvasHeight, dpr)
    const byteOffset = bufferIndex * CIRCLE_INSTANCE_FLOATS * 4
    this.device.queue.writeBuffer(this._storageBuffer, byteOffset, instanceData)
  }

  getBaseRadius(canvasWidth: number, canvasHeight: number, dpr: number): number {
    const active = this.activeInstance
    if (active && active.shapeType === 1) {
      return Math.max(active.rectWidth, active.rectHeight) * dpr * 0.5
    }
    return Math.min(canvasWidth, canvasHeight) * 0.35
  }
}
