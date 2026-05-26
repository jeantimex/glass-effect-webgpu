import type { SurfaceType } from './displacement-map'
import { WebGPURenderer } from '../webgpu/renderer'
import { GlassControlPanel } from './control-panel'
import { DisplacementMapView } from './displacement-view'
import { getGlassControls, setupCollapsibleSections } from './dom'
import { GlassInteraction } from './interaction'
import { PanelControlsOverlay } from './panel-controls'
import { GlassRenderLoop } from './render-loop'
import { createGlassSprings } from './springs'
import type { PresetType, UserParams } from './types'

export class GlassApp {
  private renderer!: WebGPURenderer
  private currentPreset: PresetType = 'circle-lens'
  private currentSurfaceType: SurfaceType = 'convex-circle'

  constructor(
    private mainCanvas: HTMLCanvasElement,
    private displacementCanvas: HTMLCanvasElement
  ) {}

  async start(): Promise<void> {
    this.renderer = new WebGPURenderer(this.mainCanvas)
    await this.renderer.init()

    const controls = getGlassControls()
    const panelControls = new PanelControlsOverlay(controls.panelControls)
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
      setCurrentPreset: (preset) => {
        this.currentPreset = preset
      },
      getCurrentPreset: () => this.currentPreset,
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
      getCurrentPreset: () => this.currentPreset,
      setCircleSize: (size) => controlPanel.setCircleSize(size),
      setRectWidth: (width) => controlPanel.setRectWidth(width),
      setRectHeight: (height) => controlPanel.setRectHeight(height),
      circleSizeSlider: controls.circleSizeSlider,
      rectWidthSlider: controls.rectWidthSlider,
      rectHeightSlider: controls.rectHeightSlider,
    })

    setupCollapsibleSections(updateDisplacementMap)
    controlPanel.setup()
    interaction.setup()
    updateDisplacementMap()

    const resizeObserver = new ResizeObserver(updateDisplacementMap)
    resizeObserver.observe(this.displacementCanvas)

    new GlassRenderLoop(
      this.renderer,
      userParams,
      springs,
      interaction,
      () => this.currentPreset,
      () => panelControls.update(this.renderer, this.currentPreset)
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
      forceActive: false,
      liquidEnabled: true,
      splitMenuOpen: false,
      splitMenuProgress: 0,
      liquidPressScale: 1.16,
      liquidPressRefraction: 1.28,
      liquidSpeed: 1,
      liquidClickSquash: 1,
      liquidDragSquash: 1,
      liquidReleaseSquash: 1,
    }
  }
}
