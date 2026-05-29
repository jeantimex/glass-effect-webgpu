import type { SurfaceType } from './displacement-map'
import { WebGPURenderer } from '../webgpu/renderer'
import { GlassControlPanel } from './control-panel'
import { DisplacementMapView } from './displacement-view'
import { getGlassControls, setupCollapsibleSections, setupSliderValueDisplays } from './dom'
import { GlassInteraction } from './interaction'
import { GlassRenderLoop } from './render-loop'
import { createGlassSprings } from './springs'
import type { UserParams } from './types'

export class GlassApp {
  private renderer!: WebGPURenderer
  private currentSurfaceType: SurfaceType = 'convex-circle'

  constructor(
    private mainCanvas: HTMLCanvasElement,
    private displacementCanvas: HTMLCanvasElement
  ) {}

  async start(): Promise<void> {
    this.renderer = new WebGPURenderer(this.mainCanvas)
    await this.renderer.init()

    const controls = getGlassControls()
    const userParams = this.createInitialUserParams()
    const springs = createGlassSprings(this.renderer)
    const displacementMap = new DisplacementMapView(
      this.displacementCanvas,
      this.renderer,
      () => userParams.scaleRatio
    )

    const updateDisplacementMap = () => {
      displacementMap.setSurfaceType(this.currentSurfaceType)
      displacementMap.render()
    }

    const controlPanel = new GlassControlPanel({
      controls,
      renderer: this.renderer,
      userParams,
      springs,
      setCurrentSurfaceType: (surfaceType) => {
        this.currentSurfaceType = surfaceType
      },
      updateDisplacementMap,
    })

    const interaction = new GlassInteraction({
      canvas: this.mainCanvas,
      renderer: this.renderer,
      userParams,
      springs,
      setCircleSize: (size) => controlPanel.setCircleSize(size),
      syncSlidersFromActiveInstance: () => controlPanel.syncSlidersFromActiveInstance(),
      updateControlsVisibility: () => controlPanel.updateControlsVisibility(),
      circleSizeSlider: controls.circleSizeSlider,
    })

    setupCollapsibleSections()
    setupSliderValueDisplays()
    controlPanel.setup()
    interaction.setup()
    updateDisplacementMap()

    const resizeObserver = new ResizeObserver(updateDisplacementMap)
    resizeObserver.observe(this.displacementCanvas)

    new GlassRenderLoop(
      this.renderer,
      userParams,
      springs,
      interaction
    ).start()
  }

  private createInitialUserParams(): UserParams {
    return {
      circleSize: this.renderer.glassParams.circleSize,
      scaleRatio: this.renderer.glassParams.scaleRatio,
      magnifyingScale: this.renderer.glassParams.magnifyingScale,
      shadowOpacity: this.renderer.glassParams.shadowOpacity,
      shadowBlur: this.renderer.glassParams.shadowBlur,
      shadowOffsetX: this.renderer.glassParams.shadowOffsetX,
      shadowOffsetY: this.renderer.glassParams.shadowOffsetY,
      specularOpacity: this.renderer.glassParams.specularOpacity,
      glassBgOpacity: this.renderer.glassParams.glassBgOpacity,
      pressedGlassBgOpacity: 0,
      liquidEnabled: true,
      liquidPressScale: 1.16,
      liquidPressRefraction: 1.28,
      liquidSpeed: 1,
      liquidClickSquash: 1,
      liquidDragSquash: 1,
      liquidReleaseSquash: 1,
    }
  }
}
