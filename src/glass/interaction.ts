import type { WebGPURenderer } from '../webgpu/renderer'
import { setSliderValue } from './dom'
import type { GlassSprings } from './springs'
import type { PresetType, UserParams } from './types'

interface GlassInteractionOptions {
  canvas: HTMLCanvasElement
  renderer: WebGPURenderer
  userParams: UserParams
  springs: GlassSprings
  getCurrentPreset: () => PresetType
  setCircleSize: (size: number) => void
  setRectWidth: (width: number) => void
  setRectHeight: (height: number) => void
  circleSizeSlider: HTMLInputElement
  rectWidthSlider: HTMLInputElement
  rectHeightSlider: HTMLInputElement
  leftCircleSizeSlider: HTMLInputElement
  centerCircleSizeSlider: HTMLInputElement
  rightCircleSizeSlider: HTMLInputElement
}

export class GlassInteraction {
  draggingGlass = false
  movedDuringDrag = false
  currentVelocity = { x: 0, y: 0 }

  private glassDragOffset = { x: 0, y: 0 }
  private lastPointerPos = { x: 0, y: 0 }
  private pointerStartPos = { x: 0, y: 0 }
  private lastPointerTime = 0
  private trackAnimationId: number | null = null

  constructor(private options: GlassInteractionOptions) {}

  setup(): void {
    const { canvas } = this.options

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerCancel)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
  }

  private isTrackPreset(): boolean {
    const preset = this.options.getCurrentPreset()
    return preset === 'switch' || preset === 'slider'
  }

  private updateCanvasCursor(event: PointerEvent): void {
    const { canvas, renderer } = this.options
    if (this.draggingGlass) {
      canvas.style.cursor = 'grabbing'
      return
    }

    const isInteractive = this.isTrackPreset()
      ? renderer.isPointInsideSwitchTrack(event.clientX, event.clientY) || renderer.isPointInsideGlass(event.clientX, event.clientY)
      : renderer.isPointInsideGlass(event.clientX, event.clientY)
    canvas.style.cursor = isInteractive ? 'grab' : 'default'
  }

  private onPointerDown = (event: PointerEvent): void => {
    const { canvas, renderer, springs, userParams } = this.options
    const preset = this.options.getCurrentPreset()
    const isTrackPreset = this.isTrackPreset()
    const isInsideTrack = renderer.isPointInsideSwitchTrack(event.clientX, event.clientY)
    const isInsideGlass = renderer.isPointInsideGlass(event.clientX, event.clientY)

    this.cancelTrackAnimation()

    if (preset === 'slider' && isInsideTrack && !isInsideGlass) {
      const progress = renderer.getSwitchProgressFromClientX(event.clientX)
      if (progress === null) return

      this.animateSwitchProgressTo(progress)
      this.updateCanvasCursor(event)
      event.preventDefault()
      return
    }

    if (isTrackPreset) {
      if (!isInsideTrack && !isInsideGlass) return
    } else if (!renderer.isPointInsideGlass(event.clientX, event.clientY)) {
      return
    }

    // Track which circle is clicked for player controls mode
    if (renderer.glassParams.playerControlsMode) {
      const clickedIndex = renderer.getClickedCircleIndex(event.clientX, event.clientY)
      renderer.setActiveCircleIndex(clickedIndex)
    }

    // Track which item is clicked for split menu mode
    if (renderer.glassParams.splitMenuMode) {
      const clickedIndex = renderer.getClickedSplitMenuIndex(event.clientX, event.clientY)
      renderer.setActiveSplitMenuIndex(clickedIndex)
    }

    this.draggingGlass = true
    this.movedDuringDrag = false
    this.glassDragOffset = renderer.getGlassDragOffset(event.clientX, event.clientY)
    this.lastPointerPos = { x: event.clientX, y: event.clientY }
    this.pointerStartPos = { x: event.clientX, y: event.clientY }
    this.lastPointerTime = performance.now()
    this.currentVelocity = { x: 0, y: 0 }

    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.72 * userParams.liquidClickSquash)
      springs.liquid.velocity += 2.6 * userParams.liquidClickSquash
    }

    if (preset === 'slider') {
      renderer.setSwitchProgressFromClientX(event.clientX)
    }

    canvas.style.cursor = 'grabbing'
    canvas.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  private onPointerMove = (event: PointerEvent): void => {
    const { renderer } = this.options
    if (!this.draggingGlass) {
      this.updateCanvasCursor(event)
      return
    }

    const now = performance.now()
    const dt = Math.max((now - this.lastPointerTime) / 1000, 1 / 120)
    const dragDistance = Math.hypot(event.clientX - this.pointerStartPos.x, event.clientY - this.pointerStartPos.y)
    if (dragDistance > 2) {
      this.movedDuringDrag = true
    }
    this.currentVelocity.x = (event.clientX - this.lastPointerPos.x) / dt
    this.currentVelocity.y = (event.clientY - this.lastPointerPos.y) / dt
    this.lastPointerPos = { x: event.clientX, y: event.clientY }
    this.lastPointerTime = now

    if (this.isTrackPreset()) {
      this.cancelTrackAnimation()
      renderer.setSwitchProgressFromClientX(event.clientX)
    } else {
      renderer.setGlassCenterFromClientPoint(event.clientX, event.clientY, this.glassDragOffset)
    }
    event.preventDefault()
  }

  private onPointerUp = (event: PointerEvent): void => {
    const { canvas, renderer, springs, userParams } = this.options
    if (!this.draggingGlass) {
      this.updateCanvasCursor(event)
      return
    }

    this.draggingGlass = false
    this.movedDuringDrag = false
    this.currentVelocity = { x: 0, y: 0 }
    const dragDistance = Math.hypot(event.clientX - this.pointerStartPos.x, event.clientY - this.pointerStartPos.y)

    const preset = this.options.getCurrentPreset()
    if (preset === 'switch' && dragDistance < 4) {
      renderer.setSwitchProgress(renderer.getSwitchProgress() > 0.5 ? 0 : 1)
    } else if (preset === 'split-menu' && dragDistance < 4) {
      userParams.splitMenuOpen = !userParams.splitMenuOpen
      springs.splitMenuProgress.target = userParams.splitMenuOpen ? 1 : 0
    }

    // Don't reset active circle here - let it persist so the shadow follows the liquid animation
    // The next click will set a new active circle

    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.58 * userParams.liquidReleaseSquash)
      springs.liquid.velocity -= 3.0 * userParams.liquidReleaseSquash
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    this.updateCanvasCursor(event)
  }

  private onPointerCancel = (event: PointerEvent): void => {
    const { canvas } = this.options
    if (!this.draggingGlass) return

    this.draggingGlass = false
    this.movedDuringDrag = false
    this.cancelTrackAnimation()
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    this.updateCanvasCursor(event)
  }

  private onPointerLeave = (): void => {
    if (!this.draggingGlass) {
      this.options.canvas.style.cursor = 'default'
    }
  }

  private animateSwitchProgressTo(targetProgress: number): void {
    const { renderer, springs, userParams } = this.options
    const startProgress = renderer.getSwitchProgress()
    const target = Math.min(Math.max(targetProgress, 0), 1)
    const duration = 260
    const startTime = performance.now()
    let previousProgress = startProgress
    let previousTime = startTime

    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.5 * userParams.liquidClickSquash)
      springs.liquid.velocity += 2.1 * userParams.liquidClickSquash
    }

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const progress = startProgress + (target - startProgress) * eased
      const dt = Math.max((now - previousTime) / 1000, 1 / 120)
      const progressVelocity = (progress - previousProgress) / dt

      this.currentVelocity.x = progressVelocity * 2400
      this.currentVelocity.y = Math.abs(progressVelocity) * 260
      renderer.setSwitchProgress(progress)

      previousProgress = progress
      previousTime = now

      if (t < 1) {
        this.trackAnimationId = requestAnimationFrame(animate)
      } else {
        if (userParams.liquidEnabled) {
          springs.liquid.value = Math.max(springs.liquid.value, 0.42 * userParams.liquidReleaseSquash)
          springs.liquid.velocity -= 2.4 * userParams.liquidReleaseSquash
        }
        this.currentVelocity = { x: 0, y: 0 }
        this.trackAnimationId = null
      }
    }

    this.trackAnimationId = requestAnimationFrame(animate)
  }

  private cancelTrackAnimation(): void {
    if (this.trackAnimationId === null) return

    cancelAnimationFrame(this.trackAnimationId)
    this.trackAnimationId = null
  }

  private onWheel = (event: WheelEvent): void => {
    const {
      renderer,
      setCircleSize,
      setRectWidth,
      setRectHeight,
      userParams,
      circleSizeSlider,
      rectWidthSlider,
      rectHeightSlider,
    } = this.options
    if (!renderer.isPointInsideGlass(event.clientX, event.clientY)) return

    const direction = event.deltaY > 0 ? -1 : 1
    if (renderer.glassParams.shapeType === 1) {
      const targetScale = direction > 0 ? 1.06 : 1 / 1.06
      const minWidth = parseFloat(rectWidthSlider.min)
      const maxWidth = parseFloat(rectWidthSlider.max)
      const minHeight = parseFloat(rectHeightSlider.min)
      const maxHeight = parseFloat(rectHeightSlider.max)
      const currentWidth = renderer.glassParams.rectWidth
      const currentHeight = renderer.glassParams.rectHeight
      const scale = direction > 0
        ? Math.min(targetScale, maxWidth / currentWidth, maxHeight / currentHeight)
        : Math.max(targetScale, minWidth / currentWidth, minHeight / currentHeight)

      setRectWidth(currentWidth * scale)
      setRectHeight(currentHeight * scale)
    } else if (renderer.glassParams.playerControlsMode) {
      const { leftCircleSizeSlider, centerCircleSizeSlider, rightCircleSizeSlider } = this.options
      const circleIndex = renderer.getClickedCircleIndex(event.clientX, event.clientY)
      if (circleIndex < 0) return

      const circle = renderer.getCircle(circleIndex)
      const step = direction * 0.02
      const min = 0.15
      const max = 0.6
      const newSize = Math.min(Math.max(circle.size + step, min), max)
      circle.size = newSize

      // Sync the appropriate slider
      const sliders = [leftCircleSizeSlider, centerCircleSizeSlider, rightCircleSizeSlider]
      setSliderValue(sliders[circleIndex], newSize)
    } else {
      const step = direction * 0.04
      const min = parseFloat(circleSizeSlider.min)
      const max = parseFloat(circleSizeSlider.max)
      setCircleSize(Math.min(Math.max(userParams.circleSize + step, min), max))
    }
    event.preventDefault()
  }
}
