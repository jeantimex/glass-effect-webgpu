import type { SurfaceType } from './displacement-map'
import {
  calculateDisplacementMap1D,
  renderDisplacementMap2D,
} from './displacement-map'
import type { WebGPURenderer } from '../webgpu/renderer'

export class DisplacementMapView {
  private surfaceType: SurfaceType = 'convex-circle'

  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: WebGPURenderer,
    private getScaleRatio: () => number
  ) {}

  setSurfaceType(surfaceType: SurfaceType): void {
    this.surfaceType = surfaceType
  }

  render(): void {
    const displacements1D = calculateDisplacementMap1D(
      this.renderer.glassParams.glassThickness,
      this.renderer.glassParams.bezelWidth,
      this.surfaceType,
      this.renderer.glassParams.refractiveIndex,
      128
    )
    renderDisplacementMap2D(
      this.canvas,
      displacements1D,
      this.renderer.glassParams.bezelWidth,
      this.getScaleRatio()
    )
  }
}
