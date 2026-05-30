import {
  GlassInstance,
  GLASS_INSTANCE_FLOATS,
  GLASS_INSTANCES_BUFFER_SIZE,
  MAX_GLASS_INSTANCES,
  type GlassInstanceConfig,
} from './glass-instance'
import { CircleInstance, DEFAULT_CIRCLE_INSTANCE_CONFIG, type CircleInstanceConfig } from './circle-instance'
import { RectangleInstance, DEFAULT_RECTANGLE_INSTANCE_CONFIG, type RectangleInstanceConfig } from './rectangle-instance'
import type { BackgroundTextureLoader } from './texture-loader'

export type ShapeType = 'circle' | 'rectangle'

export class GlassInstanceManager {
  private device: GPUDevice
  private textureLoader: BackgroundTextureLoader
  private emptyTexture: GPUTexture
  private onTextureChange: () => void
  private _instances: GlassInstance[] = []
  private _activeIndex = 0
  private _storageBuffer: GPUBuffer
  private _strategy: number = 0 // 0 = stack, 1 = merge
  private _shapeType: ShapeType = 'circle'
  private _mixedMode: boolean = false // Allow mixing circle and rectangle instances

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
      size: GLASS_INSTANCES_BUFFER_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    this.reset()
  }

  get instances(): readonly GlassInstance[] {
    return this._instances
  }

  get count(): number {
    return this._instances.length
  }

  get activeIndex(): number {
    return this._activeIndex
  }

  get activeInstance(): GlassInstance | undefined {
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

  get shapeType(): ShapeType {
    return this._shapeType
  }

  get mixedMode(): boolean {
    return this._mixedMode
  }

  set mixedMode(value: boolean) {
    this._mixedMode = value
  }

  setActiveIndex(index: number): void {
    // Allow -1 for deselection
    if (index < 0) {
      for (const instance of this._instances) {
        instance.isActive = false
      }
      this._activeIndex = -1
      return
    }

    const clampedIndex = Math.min(index, this._instances.length - 1)

    for (let i = 0; i < this._instances.length; i++) {
      this._instances[i].isActive = i === clampedIndex
    }

    this._activeIndex = clampedIndex
  }

  getInstance(index: number): GlassInstance | undefined {
    return this._instances[index]
  }

  getCircleInstance(index: number): CircleInstance | undefined {
    const instance = this._instances[index]
    return instance instanceof CircleInstance ? instance : undefined
  }

  getRectangleInstance(index: number): RectangleInstance | undefined {
    const instance = this._instances[index]
    return instance instanceof RectangleInstance ? instance : undefined
  }

  reset(shapeType?: ShapeType, initialConfig?: Partial<CircleInstanceConfig | RectangleInstanceConfig>): void {
    this._instances = []
    this._activeIndex = 0

    if (shapeType) {
      this._shapeType = shapeType
    }

    this.addInstance({
      ...initialConfig,
      centerX: 0.5,
      centerY: 0.5,
      isActive: true,
    })
  }

  clear(): void {
    this._instances = []
    this._activeIndex = -1
  }

  addInstance(config?: Partial<CircleInstanceConfig | RectangleInstanceConfig>, overrideShapeType?: ShapeType): number {
    if (this._instances.length >= MAX_GLASS_INSTANCES) {
      return this._instances.length - 1
    }

    const index = this._instances.length
    const newPosition = this.calculateNewPosition(index)

    // Determine which shape type to create
    const shapeToCreate = overrideShapeType ?? this._shapeType

    let instance: GlassInstance

    if (shapeToCreate === 'rectangle') {
      // Get base config from active instance if it's a rectangle, otherwise use defaults
      const activeRect = this._instances[this._activeIndex] instanceof RectangleInstance
        ? this._instances[this._activeIndex] as RectangleInstance
        : null
      const baseConfig = activeRect
        ? this.extractRectangleConfig(activeRect)
        : DEFAULT_RECTANGLE_INSTANCE_CONFIG

      instance = new RectangleInstance(
        this.device,
        this.textureLoader,
        this.emptyTexture,
        {
          ...baseConfig,
          ...newPosition,
          ...config,
          isActive: false,
        } as Partial<RectangleInstanceConfig>,
        this.onTextureChange
      )
    } else {
      // Get base config from active instance if it's a circle, otherwise use defaults
      const activeCircle = this._instances[this._activeIndex] instanceof CircleInstance
        ? this._instances[this._activeIndex] as CircleInstance
        : null
      const baseConfig = activeCircle
        ? this.extractCircleConfig(activeCircle)
        : DEFAULT_CIRCLE_INSTANCE_CONFIG

      instance = new CircleInstance(
        this.device,
        this.textureLoader,
        this.emptyTexture,
        {
          ...baseConfig,
          ...newPosition,
          ...config,
          isActive: false,
        } as Partial<CircleInstanceConfig>,
        this.onTextureChange
      )
    }

    // Copy icon from active instance if it has one and new instance supports icons
    const activeInstance = this._instances[this._activeIndex]
    if (activeInstance?.iconUrl && instance instanceof CircleInstance) {
      void instance.setIcon(activeInstance.iconUrl)
    }

    this._instances.push(instance)
    this.setActiveIndex(index)

    return index
  }

  removeInstance(index: number): boolean {
    if (this._instances.length < 1 || index < 0 || index >= this._instances.length) {
      return false
    }

    this._instances.splice(index, 1)
    this._activeIndex = -1

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
    // Iterate in reverse so topmost (last-added) instances are checked first
    for (let i = this._instances.length - 1; i >= 0; i--) {
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
      if (hitDistance <= 0) {
        return i
      }
    }

    return -1
  }

  private calculateInstanceDistance(
    instance: GlassInstance,
    pointX: number,
    pointY: number,
    centerX: number,
    centerY: number,
    canvasWidth: number,
    canvasHeight: number,
    dpr: number
  ): number {
    if (instance instanceof RectangleInstance) {
      const rectWidth = instance.rectWidth * dpr
      const rectHeight = instance.rectHeight * dpr
      const rectRadius = Math.min(instance.rectRadius * dpr, Math.min(rectWidth, rectHeight) * 0.5)
      return this.roundedRectDistance(
        pointX - centerX,
        pointY - centerY,
        rectWidth,
        rectHeight,
        rectRadius
      )
    } else if (instance instanceof CircleInstance) {
      const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.35
      return Math.hypot(pointX - centerX, pointY - centerY) - baseRadius * instance.size
    }
    return Number.POSITIVE_INFINITY
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

    const halfDims = instance.getHalfDimensions(canvasWidth, canvasHeight, dpr)

    const minX = halfDims.width
    const maxX = canvasWidth - halfDims.width
    const minY = halfDims.height
    const maxY = canvasHeight - halfDims.height

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
      const verticalStep = 0.08
      centerY = Math.min(centerY + verticalStep, 0.9)
    } else {
      const pair = Math.max(1, Math.floor(index / 2) + 1)
      const direction = index % 2 === 0 ? -1 : 1
      const horizontalStep = 0.12 * pair
      const verticalStep = 0.08 * pair
      centerX = Math.min(Math.max(0.5 + direction * horizontalStep, 0.1), 0.9)
      centerY = Math.min(Math.max(0.5 + verticalStep * (index % 4 === 0 ? -1 : 1), 0.1), 0.9)
    }

    return { centerX, centerY }
  }

  private extractCircleConfig(instance: CircleInstance): CircleInstanceConfig {
    return {
      ...this.extractBaseConfig(instance),
      size: instance.size,
      iconType: instance.iconType,
      iconOpacity: instance.iconOpacity,
      iconScale: instance.iconScale,
      iconColorR: instance.iconColorR,
      iconColorG: instance.iconColorG,
      iconColorB: instance.iconColorB,
    }
  }

  private extractRectangleConfig(instance: RectangleInstance): RectangleInstanceConfig {
    return {
      ...this.extractBaseConfig(instance),
      rectWidth: instance.rectWidth,
      rectHeight: instance.rectHeight,
      rectRadius: instance.rectRadius,
    }
  }

  private extractBaseConfig(instance: GlassInstance): GlassInstanceConfig {
    return {
      centerX: instance.centerX,
      centerY: instance.centerY,
      shapeType: instance.shapeType,
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
      specularThickness: instance.specularThickness,
      specularBlur: instance.specularBlur,
      specularAngle: instance.specularAngle,
      specularSaturation: instance.specularSaturation,
      specularType: instance.specularType,
      glassTintR: instance.glassTintR,
      glassTintG: instance.glassTintG,
      glassTintB: instance.glassTintB,
      glassBgOpacity: instance.glassBgOpacity,
      pressedGlassBgOpacity: instance.pressedGlassBgOpacity,
      chromaticAberration: instance.chromaticAberration,
      chromaticStrength: instance.chromaticStrength,
      chromaticBase: instance.chromaticBase,
      layerIndex: instance.layerIndex,
      isActive: instance.isActive,
    }
  }

  updateStorageBuffer(canvasWidth: number, canvasHeight: number, dpr: number): void {
    const fullData = new Float32Array(GLASS_INSTANCE_FLOATS * MAX_GLASS_INSTANCES)

    for (let i = 0; i < this._instances.length; i++) {
      const instanceData = this._instances[i].toBufferData(canvasWidth, canvasHeight, dpr)
      fullData.set(instanceData, i * GLASS_INSTANCE_FLOATS)
    }

    this.device.queue.writeBuffer(this._storageBuffer, 0, fullData)
  }

  writeSingleInstanceToBuffer(
    instance: GlassInstance,
    canvasWidth: number,
    canvasHeight: number,
    dpr: number,
    bufferIndex: number = 0
  ): void {
    const instanceData = instance.toBufferData(canvasWidth, canvasHeight, dpr)
    const byteOffset = bufferIndex * GLASS_INSTANCE_FLOATS * 4
    this.device.queue.writeBuffer(this._storageBuffer, byteOffset, instanceData)
  }

  getBaseRadius(canvasWidth: number, canvasHeight: number, dpr: number): number {
    const active = this.activeInstance
    if (active) {
      return active.getEffectiveRadius(canvasWidth, canvasHeight, dpr)
    }
    return Math.min(canvasWidth, canvasHeight) * 0.35
  }
}

// Re-export for backwards compatibility
export { CircleInstance } from './circle-instance'
export { RectangleInstance } from './rectangle-instance'
export { GlassInstance } from './glass-instance'
