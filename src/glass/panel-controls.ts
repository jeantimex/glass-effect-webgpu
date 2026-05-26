import type { WebGPURenderer } from '../webgpu/renderer'
import type { PresetType } from './types'

export class PanelControlsOverlay {
  constructor(private element: HTMLElement) {}

  update(renderer: WebGPURenderer, preset: PresetType): void {
    const visible = preset === 'panel'
    this.element.classList.toggle('hidden', !visible)
    if (!visible) return

    const center = renderer.getGlassCenterCssPosition()
    const { rectWidth, rectHeight, scaleX, scaleY } = renderer.glassParams

    this.element.style.left = `${center.x}px`
    this.element.style.top = `${center.y}px`
    this.element.style.width = `${rectWidth * scaleX}px`
    this.element.style.height = `${rectHeight * scaleY}px`
  }
}
