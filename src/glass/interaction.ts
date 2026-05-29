import type { WebGPURenderer } from '../webgpu/renderer'
import { setSliderValue } from './dom'
import type { GlassSprings } from './springs'
import type { UserParams } from './types'

interface GlassInteractionOptions {
  canvas: HTMLCanvasElement
  renderer: WebGPURenderer
  userParams: UserParams
  springs: GlassSprings
  setCircleSize: (size: number) => void
  syncSlidersFromActiveInstance: () => void
  updateControlsVisibility: () => void
  circleSizeSlider: HTMLInputElement
}

export class GlassInteraction {
  draggingGlass = false
  movedDuringDrag = false
  currentVelocity = { x: 0, y: 0 }

  private cursorRoot: HTMLElement | null = null
  private circlePresetDragOffset = { x: 0, y: 0 }
  private lastPointerPos = { x: 0, y: 0 }
  private pointerStartPos = { x: 0, y: 0 }
  private lastPointerTime = 0
  private draggingCirclePresetIndex = -1

  constructor(private options: GlassInteractionOptions) {}

  setup(): void {
    const { canvas } = this.options
    this.cursorRoot = canvas.closest<HTMLElement>('.preview')

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerCancel)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.cursorRoot?.addEventListener('pointermove', this.onCursorPointerMove, { capture: true })
    this.cursorRoot?.addEventListener('pointerleave', this.onCursorPointerLeave)
  }

  private updateCursor(event: PointerEvent): void {
    const { canvas, renderer } = this.options
    const cursorTarget = this.cursorRoot ?? canvas

    if (this.draggingGlass) {
      cursorTarget.style.cursor = 'grabbing'
      canvas.style.cursor = 'grabbing'
      return
    }

    let cursor = 'default'
    if (renderer.isPointInsideGlass(event.clientX, event.clientY)) {
      cursor = 'grab'
    } else if (this.isPointOverText(event.clientX, event.clientY)) {
      cursor = 'text'
    }

    cursorTarget.style.cursor = cursor
    canvas.style.cursor = cursor
  }

  private isPointOverText(clientX: number, clientY: number): boolean {
    const textRoot = this.cursorRoot?.querySelector<HTMLElement>('.html-in-canvas')
    if (!textRoot) return false

    const walker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
    })

    while (walker.nextNode()) {
      const range = document.createRange()
      range.selectNodeContents(walker.currentNode)
      const rects = range.getClientRects()
      range.detach()

      for (const rect of rects) {
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          return true
        }
      }
    }

    return false
  }

  private onPointerDown = (event: PointerEvent): void => {
    const { canvas, renderer, springs, userParams } = this.options

    const clickedIndex = renderer.getClickedCirclePresetIndex(event.clientX, event.clientY)
    if (clickedIndex < 0) {
      // Clicked on empty canvas - deselect current instance
      renderer.setCirclePresetActiveIndex(-1)
      this.options.updateControlsVisibility()
      this.updateCursor(event)
      return
    }

    renderer.setCirclePresetActiveIndex(clickedIndex)
    this.draggingGlass = true
    this.draggingCirclePresetIndex = clickedIndex
    this.movedDuringDrag = false
    this.circlePresetDragOffset = renderer.getCirclePresetDragOffset(clickedIndex, event.clientX, event.clientY)
    this.lastPointerPos = { x: event.clientX, y: event.clientY }
    this.pointerStartPos = { x: event.clientX, y: event.clientY }
    this.lastPointerTime = performance.now()
    this.currentVelocity = { x: 0, y: 0 }
    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.72 * userParams.liquidClickSquash)
      springs.liquid.velocity += 2.6 * userParams.liquidClickSquash
    }
    this.options.syncSlidersFromActiveInstance()
    this.options.updateControlsVisibility()
    this.updateCursor(event)
    canvas.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  private onPointerMove = (event: PointerEvent): void => {
    const { renderer } = this.options
    if (!this.draggingGlass) {
      this.updateCursor(event)
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

    if (this.draggingCirclePresetIndex >= 0) {
      renderer.setCirclePresetCircleFromClientPoint(
        this.draggingCirclePresetIndex,
        event.clientX,
        event.clientY,
        this.circlePresetDragOffset
      )
    }
    event.preventDefault()
  }

  private onPointerUp = (event: PointerEvent): void => {
    const { canvas, springs, userParams } = this.options
    if (!this.draggingGlass) {
      this.updateCursor(event)
      return
    }

    this.draggingGlass = false
    this.movedDuringDrag = false
    this.currentVelocity = { x: 0, y: 0 }
    this.draggingCirclePresetIndex = -1

    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.58 * userParams.liquidReleaseSquash)
      springs.liquid.velocity -= 3.0 * userParams.liquidReleaseSquash
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    this.updateCursor(event)
  }

  private onPointerCancel = (event: PointerEvent): void => {
    const { canvas } = this.options
    if (!this.draggingGlass) return

    this.draggingGlass = false
    this.movedDuringDrag = false
    this.draggingCirclePresetIndex = -1
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    this.updateCursor(event)
  }

  private onPointerLeave = (): void => {
    if (!this.draggingGlass) {
      this.setDefaultCursor()
    }
  }

  private onCursorPointerMove = (event: PointerEvent): void => {
    this.updateCursor(event)
  }

  private onCursorPointerLeave = (): void => {
    if (!this.draggingGlass) {
      this.setDefaultCursor()
    }
  }

  private setDefaultCursor(): void {
    const { canvas } = this.options
    const cursorTarget = this.cursorRoot ?? canvas
    cursorTarget.style.cursor = 'default'
    canvas.style.cursor = 'default'
  }

  private onWheel = (event: WheelEvent): void => {
    const { renderer, setCircleSize, circleSizeSlider } = this.options
    if (!renderer.isPointInsideGlass(event.clientX, event.clientY)) return

    const direction = event.deltaY > 0 ? -1 : 1
    const activeCircle = renderer.getActiveCircleInstance()
    const activeRect = renderer.getActiveRectangleInstance()

    if (activeRect) {
      const targetScale = direction > 0 ? 1.06 : 1 / 1.06
      const minDim = 48
      const maxDim = 760
      const currentWidth = activeRect.rectWidth
      const currentHeight = activeRect.rectHeight
      const scale = direction > 0
        ? Math.min(targetScale, maxDim / currentWidth, maxDim / currentHeight)
        : Math.max(targetScale, minDim / currentWidth, minDim / currentHeight)

      activeRect.rectWidth = currentWidth * scale
      activeRect.rectHeight = currentHeight * scale
      this.options.syncSlidersFromActiveInstance()
    } else if (activeCircle) {
      const step = direction * 0.04
      const min = parseFloat(circleSizeSlider.min)
      const max = parseFloat(circleSizeSlider.max)
      const newSize = Math.min(Math.max(activeCircle.size + step, min), max)
      activeCircle.size = newSize
      setCircleSize(newSize)
      setSliderValue(circleSizeSlider, newSize)
    }
    event.preventDefault()
  }
}
