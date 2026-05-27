import type { WebGPURenderer } from '../webgpu/renderer'
import type { GlassSprings } from './springs'
import { stepGlassSprings } from './springs'
import type { PresetType, UserParams } from './types'

export interface InteractionRenderState {
  draggingGlass: boolean
  currentVelocity: { x: number; y: number }
}

export class GlassRenderLoop {
  private lastFrameTime = performance.now()

  constructor(
    private renderer: WebGPURenderer,
    private userParams: UserParams,
    private springs: GlassSprings,
    private interactionState: InteractionRenderState,
    private getCurrentPreset: () => PresetType,
    private afterRender: () => void = () => {}
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

    // Pass base shadow values (from userParams) so only active circle gets animated shadow
    this.renderer.render({
      opacity: this.userParams.shadowOpacity,
      blur: this.userParams.shadowBlur,
      offsetX: this.userParams.shadowOffsetX,
      offsetY: this.userParams.shadowOffsetY,
    })
    this.afterRender()
    requestAnimationFrame(this.render)
  }

  private updateSpringTargets(dt: number): void {
    const active = this.interactionState.draggingGlass || this.userParams.forceActive
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

    if (active) {
      this.springs.scale.target = this.userParams.circleSize * (this.userParams.liquidEnabled ? this.userParams.liquidPressScale : 1)
      this.springs.refraction.target = this.userParams.scaleRatio * (this.userParams.liquidEnabled ? this.userParams.liquidPressRefraction + dragLiquid * 0.45 : 1)
      this.springs.magnification.target = this.userParams.magnifyingScale
      this.springs.shadowOpacity.target = this.userParams.liquidEnabled ? Math.min(this.userParams.shadowOpacity + 0.1, 1) : this.userParams.shadowOpacity
      this.springs.shadowBlur.target = this.userParams.liquidEnabled ? this.userParams.shadowBlur * 0.72 : this.userParams.shadowBlur
      this.springs.shadowOffsetY.target = this.userParams.liquidEnabled ? this.userParams.shadowOffsetY + 5 : this.userParams.shadowOffsetY
      this.springs.specularOpacity.target = this.userParams.liquidEnabled ? Math.min(this.userParams.specularOpacity + 0.22, 1) : this.userParams.specularOpacity
      this.springs.glassBgOpacity.target = this.userParams.pressedGlassBgOpacity
      this.springs.liquid.target = 0
    } else {
      this.springs.scale.target = this.userParams.circleSize
      this.springs.refraction.target = this.userParams.scaleRatio
      this.springs.magnification.target = this.userParams.magnifyingScale
      this.springs.shadowOpacity.target = this.userParams.shadowOpacity
      this.springs.shadowBlur.target = this.userParams.shadowBlur
      this.springs.shadowOffsetY.target = this.userParams.shadowOffsetY
      this.springs.specularOpacity.target = this.userParams.specularOpacity
      this.springs.glassBgOpacity.target = this.userParams.glassBgOpacity
      this.springs.liquid.target = 0
    }

    const velocityX = Math.min(Math.abs(this.interactionState.currentVelocity.x) * 0.00016 * this.userParams.liquidDragSquash * liquidAmount, 0.24 * this.userParams.liquidDragSquash)
    const velocityY = Math.min(Math.abs(this.interactionState.currentVelocity.y) * 0.00016 * this.userParams.liquidDragSquash * liquidAmount, 0.24 * this.userParams.liquidDragSquash)
    this.springs.deformationX.target = 1.0 + this.springs.liquid.value * 0.12 * liquidAmount + velocityX - velocityY * 0.45
    this.springs.deformationY.target = 1.0 - this.springs.liquid.value * 0.08 * liquidAmount + velocityY - velocityX * 0.45
  }

  private applySpringValues(): void {
    const interactionScale = this.springs.scale.value
    const isRectangle = this.renderer.glassParams.shapeType === 1
    const preset = this.getCurrentPreset()
    const isPlayerControls = preset === 'player-controls'
    const isSplitMenu = preset === 'split-menu'
    const isMultiItem = isPlayerControls || isSplitMenu
    // Player controls and split menu use fixed settings - effects are per-item
    this.renderer.glassParams.circleSize = (isRectangle || isPlayerControls) ? this.userParams.circleSize : this.springs.scale.value
    // Multi-item modes keep shared glass properties constant - only deformation and shadow animate per-item
    this.renderer.glassParams.scaleRatio = isMultiItem ? this.userParams.scaleRatio : this.springs.refraction.value
    this.renderer.glassParams.magnifyingScale = this.springs.magnification.value
    this.renderer.glassParams.scaleX = this.springs.deformationX.value * (isRectangle ? interactionScale : 1)
    this.renderer.glassParams.scaleY = this.springs.deformationY.value * (isRectangle ? interactionScale : 1)
    this.renderer.glassParams.shadowOpacity = this.springs.shadowOpacity.value
    this.renderer.glassParams.shadowBlur = this.springs.shadowBlur.value
    this.renderer.glassParams.shadowOffsetX = this.userParams.shadowOffsetX
    this.renderer.glassParams.shadowOffsetY = this.springs.shadowOffsetY.value
    this.renderer.glassParams.specularOpacity = isMultiItem ? this.userParams.specularOpacity : this.springs.specularOpacity.value
    this.renderer.glassParams.glassBgOpacity = isMultiItem ? this.userParams.glassBgOpacity : this.springs.glassBgOpacity.value
    this.renderer.glassParams.splitMenuProgress = this.springs.splitMenuProgress.value
    this.renderer.glassParams.liquidEnabled = this.userParams.liquidEnabled
    this.renderer.glassParams.splitMenuMode = preset === 'split-menu'
  }
}
