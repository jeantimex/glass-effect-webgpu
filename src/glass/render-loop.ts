import type { WebGPURenderer } from '../webgpu/renderer'
import type { GlassSprings } from './springs'
import { stepGlassSprings } from './springs'
import type { UserParams } from './types'

export interface InteractionRenderState {
  draggingGlass: boolean
  movedDuringDrag: boolean
  currentVelocity: { x: number; y: number }
}

export class GlassRenderLoop {
  private lastFrameTime = performance.now()
  private lastActiveInstanceIndex = -1

  constructor(
    private renderer: WebGPURenderer,
    private userParams: UserParams,
    private springs: GlassSprings,
    private interactionState: InteractionRenderState
  ) {}

  start(): void {
    this.render()
  }

  private render = (): void => {
    const now = performance.now()
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05)
    this.lastFrameTime = now

    this.updateSpringTargets(dt)
    stepGlassSprings(this.springs, dt, this.userParams.liquidEnabled ? this.userParams.liquidSpeed : 1)
    this.applySpringValues()

    this.renderer.render({
      opacity: this.userParams.shadowOpacity,
      blur: this.userParams.shadowBlur,
      offsetX: this.userParams.shadowOffsetX,
      offsetY: this.userParams.shadowOffsetY,
    })
    requestAnimationFrame(this.render)
  }

  private updateSpringTargets(dt: number): void {
    const active = this.interactionState.draggingGlass
    const velocityDecay = Math.exp(-dt * (active ? 5.5 : 12))
    this.interactionState.currentVelocity.x *= velocityDecay
    this.interactionState.currentVelocity.y *= velocityDecay

    const speed = Math.hypot(
      this.interactionState.currentVelocity.x,
      this.interactionState.currentVelocity.y
    )
    const liquidAmount = this.userParams.liquidEnabled ? 1 : 0
    const dragLiquid = this.interactionState.draggingGlass
      ? Math.min(speed * 0.00018 * this.userParams.liquidDragSquash * liquidAmount, 0.28 * this.userParams.liquidDragSquash)
      : 0

    const activeInstance = this.renderer.getActiveGlassInstance()
    const currentActiveIndex = this.renderer.getCirclePresetActiveIndex()
    const pressedGlassBgOpacity = activeInstance?.pressedGlassBgOpacity ?? this.userParams.pressedGlassBgOpacity
    const glassBgOpacity = activeInstance?.glassBgOpacity ?? this.userParams.glassBgOpacity

    if (currentActiveIndex !== this.lastActiveInstanceIndex) {
      this.springs.glassBgOpacity.value = glassBgOpacity
      this.springs.glassBgOpacity.target = glassBgOpacity
      this.lastActiveInstanceIndex = currentActiveIndex
    }

    if (active) {
      this.springs.scale.target = this.userParams.circleSize * (this.userParams.liquidEnabled ? this.userParams.liquidPressScale : 1)
      this.springs.refraction.target = this.userParams.scaleRatio * (this.userParams.liquidEnabled ? this.userParams.liquidPressRefraction + dragLiquid * 0.45 : 1)
      this.springs.magnification.target = this.userParams.magnifyingScale
      this.springs.shadowOpacity.target = this.userParams.liquidEnabled ? Math.min(this.userParams.shadowOpacity + 0.1, 1) : this.userParams.shadowOpacity
      this.springs.shadowBlur.target = this.userParams.liquidEnabled ? this.userParams.shadowBlur * 0.72 : this.userParams.shadowBlur
      this.springs.shadowOffsetY.target = this.userParams.liquidEnabled ? this.userParams.shadowOffsetY + 5 : this.userParams.shadowOffsetY
      this.springs.specularOpacity.target = this.userParams.liquidEnabled ? Math.min(this.userParams.specularOpacity + 0.22, 1) : this.userParams.specularOpacity
      this.springs.glassBgOpacity.target = pressedGlassBgOpacity
      this.springs.liquid.target = 0
    } else {
      this.springs.scale.target = this.userParams.circleSize
      this.springs.refraction.target = this.userParams.scaleRatio
      this.springs.magnification.target = this.userParams.magnifyingScale
      this.springs.shadowOpacity.target = this.userParams.shadowOpacity
      this.springs.shadowBlur.target = this.userParams.shadowBlur
      this.springs.shadowOffsetY.target = this.userParams.shadowOffsetY
      this.springs.specularOpacity.target = this.userParams.specularOpacity
      this.springs.glassBgOpacity.target = glassBgOpacity
      this.springs.liquid.target = 0
    }

    const velocityX = Math.min(Math.abs(this.interactionState.currentVelocity.x) * 0.00016 * this.userParams.liquidDragSquash * liquidAmount, 0.24 * this.userParams.liquidDragSquash)
    const velocityY = Math.min(Math.abs(this.interactionState.currentVelocity.y) * 0.00016 * this.userParams.liquidDragSquash * liquidAmount, 0.24 * this.userParams.liquidDragSquash)
    this.springs.deformationX.target = 1.0 + this.springs.liquid.value * 0.12 * liquidAmount + velocityX - velocityY * 0.45
    this.springs.deformationY.target = 1.0 - this.springs.liquid.value * 0.08 * liquidAmount + velocityY - velocityX * 0.45
  }

  private applySpringValues(): void {
    this.renderer.glassParams.circleSize = this.userParams.circleSize
    this.renderer.glassParams.scaleRatio = this.userParams.scaleRatio
    this.renderer.glassParams.magnifyingScale = this.springs.magnification.value
    this.renderer.glassParams.scaleX = this.springs.deformationX.value
    this.renderer.glassParams.scaleY = this.springs.deformationY.value
    this.renderer.glassParams.shadowOpacity = this.springs.shadowOpacity.value
    this.renderer.glassParams.shadowBlur = this.springs.shadowBlur.value
    this.renderer.glassParams.shadowOffsetX = this.userParams.shadowOffsetX
    this.renderer.glassParams.shadowOffsetY = this.springs.shadowOffsetY.value
    this.renderer.glassParams.specularOpacity = this.userParams.specularOpacity
    this.renderer.glassParams.glassBgOpacity = this.userParams.glassBgOpacity
    this.renderer.glassParams.liquidEnabled = this.userParams.liquidEnabled
    this.renderer.glassParams.circlePresetMode = true

    const activeInstance = this.renderer.getActiveGlassInstance()
    if (activeInstance) {
      activeInstance.runtimeGlassBgOpacity = this.springs.glassBgOpacity.value
    }
  }
}
