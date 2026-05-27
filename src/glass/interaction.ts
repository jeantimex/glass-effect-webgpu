import type { WebGPURenderer } from '../webgpu/renderer'
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
}

export class GlassInteraction {
  draggingGlass = false
  currentVelocity = { x: 0, y: 0 }

  private glassDragOffset = { x: 0, y: 0 }
  private lastPointerPos = { x: 0, y: 0 }
  private pointerStartPos = { x: 0, y: 0 }
  private lastPointerTime = 0

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
      ? renderer.isPointInsideSwitchTrack(event.clientX, event.clientY)
      : renderer.isPointInsideGlass(event.clientX, event.clientY)
    canvas.style.cursor = isInteractive ? 'grab' : 'default'
  }

  private onPointerDown = (event: PointerEvent): void => {
    const { canvas, renderer, springs, userParams } = this.options
    if (this.isTrackPreset()) {
      if (!renderer.isPointInsideSwitchTrack(event.clientX, event.clientY)) return
    } else if (!renderer.isPointInsideGlass(event.clientX, event.clientY)) {
      return
    }

    // Track which circle is clicked for player controls mode
    if (renderer.glassParams.playerControlsMode) {
      const clickedIndex = renderer.getClickedCircleIndex(event.clientX, event.clientY)
      renderer.setActiveCircleIndex(clickedIndex)
    }

    this.draggingGlass = true
    this.glassDragOffset = renderer.getGlassDragOffset(event.clientX, event.clientY)
    this.lastPointerPos = { x: event.clientX, y: event.clientY }
    this.pointerStartPos = { x: event.clientX, y: event.clientY }
    this.lastPointerTime = performance.now()
    this.currentVelocity = { x: 0, y: 0 }

    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.72 * userParams.liquidClickSquash)
      springs.liquid.velocity += 2.6 * userParams.liquidClickSquash
    }

    if (this.options.getCurrentPreset() === 'slider') {
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
    this.currentVelocity.x = (event.clientX - this.lastPointerPos.x) / dt
    this.currentVelocity.y = (event.clientY - this.lastPointerPos.y) / dt
    this.lastPointerPos = { x: event.clientX, y: event.clientY }
    this.lastPointerTime = now

    if (this.isTrackPreset()) {
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
    this.currentVelocity = { x: 0, y: 0 }
    const dragDistance = Math.hypot(event.clientX - this.pointerStartPos.x, event.clientY - this.pointerStartPos.y)

    const preset = this.options.getCurrentPreset()
    if (preset === 'switch' && dragDistance < 4) {
      renderer.setSwitchProgress(renderer.getSwitchProgress() > 0.5 ? 0 : 1)
    } else if (preset === 'split-menu' && dragDistance < 4) {
      userParams.splitMenuOpen = !userParams.splitMenuOpen
      springs.splitMenuProgress.target = userParams.splitMenuOpen ? 1 : 0
    }

    // Reset active circle on pointer up
    if (renderer.glassParams.playerControlsMode) {
      renderer.setActiveCircleIndex(-1)
    }

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
    } else {
      const step = direction * 0.04
      const min = parseFloat(circleSizeSlider.min)
      const max = parseFloat(circleSizeSlider.max)
      setCircleSize(Math.min(Math.max(userParams.circleSize + step, min), max))
    }
    event.preventDefault()
  }
}
