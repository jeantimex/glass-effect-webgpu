export interface GlassControls {
  presetSelect: HTMLSelectElement
  panelControls: HTMLElement
  bezelSlider: HTMLInputElement
  thicknessSlider: HTMLInputElement
  scaleSlider: HTMLInputElement
  gridCellSizeSlider: HTMLInputElement
  gridSpeedSlider: HTMLInputElement
  refractiveIndexSlider: HTMLInputElement
  magnifyingScaleSlider: HTMLInputElement
  circleSizeSlider: HTMLInputElement
  iconTypeSelect: HTMLSelectElement
  iconOpacitySlider: HTMLInputElement
  iconScaleSlider: HTMLInputElement
  iconColorInput: HTMLInputElement
  rectWidthSlider: HTMLInputElement
  rectHeightSlider: HTMLInputElement
  rectRadiusSlider: HTMLInputElement
  switchTrackWidthSlider: HTMLInputElement
  switchTrackHeightSlider: HTMLInputElement
  switchTrackOffOpacitySlider: HTMLInputElement
  switchTrackOnOpacitySlider: HTMLInputElement
  forceActiveCheckbox: HTMLInputElement
  backgroundTypeSelect: HTMLSelectElement
  bgBrightnessSlider: HTMLInputElement
  specularOpacitySlider: HTMLInputElement
  specularAngleSlider: HTMLInputElement
  specularSaturationSlider: HTMLInputElement
  specularTypeSelect: HTMLSelectElement
  blurTypeSelect: HTMLSelectElement
  blurAmountSlider: HTMLInputElement
  progressiveBlurSlider: HTMLInputElement
  progressiveBlurTypeSelect: HTMLSelectElement
  glassThemeSelect: HTMLSelectElement
  glassBgOpacitySlider: HTMLInputElement
  pressedGlassBgOpacitySlider: HTMLInputElement
  liquidEnabledCheckbox: HTMLInputElement
  liquidPressScaleSlider: HTMLInputElement
  liquidPressRefractionSlider: HTMLInputElement
  liquidSpeedSlider: HTMLInputElement
  liquidClickSquashSlider: HTMLInputElement
  liquidDragSquashSlider: HTMLInputElement
  liquidReleaseSquashSlider: HTMLInputElement
  shadowOpacitySlider: HTMLInputElement
  shadowBlurSlider: HTMLInputElement
  shadowOffsetXSlider: HTMLInputElement
  shadowOffsetYSlider: HTMLInputElement
  surfaceButtons: NodeListOf<HTMLButtonElement>
  circleOnlyControls: NodeListOf<HTMLElement>
  iconOnlyControls: NodeListOf<HTMLElement>
  rectOnlyControls: NodeListOf<HTMLElement>
  switchOnlyControls: NodeListOf<HTMLElement>
  gridOnlyControls: NodeListOf<HTMLElement>
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`Missing #${id}`)
  }
  return element as T
}

export function getGlassControls(): GlassControls {
  return {
    presetSelect: getElement<HTMLSelectElement>('presetType'),
    panelControls: getElement<HTMLElement>('panelControls'),
    bezelSlider: getElement<HTMLInputElement>('bezelWidth'),
    thicknessSlider: getElement<HTMLInputElement>('glassThickness'),
    scaleSlider: getElement<HTMLInputElement>('scaleRatio'),
    gridCellSizeSlider: getElement<HTMLInputElement>('gridCellSize'),
    gridSpeedSlider: getElement<HTMLInputElement>('gridSpeed'),
    refractiveIndexSlider: getElement<HTMLInputElement>('refractiveIndex'),
    magnifyingScaleSlider: getElement<HTMLInputElement>('magnifyingScale'),
    circleSizeSlider: getElement<HTMLInputElement>('circleSize'),
    iconTypeSelect: getElement<HTMLSelectElement>('iconType'),
    iconOpacitySlider: getElement<HTMLInputElement>('iconOpacity'),
    iconScaleSlider: getElement<HTMLInputElement>('iconScale'),
    iconColorInput: getElement<HTMLInputElement>('iconColor'),
    rectWidthSlider: getElement<HTMLInputElement>('rectWidth'),
    rectHeightSlider: getElement<HTMLInputElement>('rectHeight'),
    rectRadiusSlider: getElement<HTMLInputElement>('rectRadius'),
    switchTrackWidthSlider: getElement<HTMLInputElement>('switchTrackWidth'),
    switchTrackHeightSlider: getElement<HTMLInputElement>('switchTrackHeight'),
    switchTrackOffOpacitySlider: getElement<HTMLInputElement>('switchTrackOffOpacity'),
    switchTrackOnOpacitySlider: getElement<HTMLInputElement>('switchTrackOnOpacity'),
    forceActiveCheckbox: getElement<HTMLInputElement>('forceActive'),
    backgroundTypeSelect: getElement<HTMLSelectElement>('backgroundType'),
    bgBrightnessSlider: getElement<HTMLInputElement>('bgBrightness'),
    specularOpacitySlider: getElement<HTMLInputElement>('specularOpacity'),
    specularAngleSlider: getElement<HTMLInputElement>('specularAngle'),
    specularSaturationSlider: getElement<HTMLInputElement>('specularSaturation'),
    specularTypeSelect: getElement<HTMLSelectElement>('specularType'),
    blurTypeSelect: getElement<HTMLSelectElement>('blurType'),
    blurAmountSlider: getElement<HTMLInputElement>('blurAmount'),
    progressiveBlurSlider: getElement<HTMLInputElement>('progressiveBlur'),
    progressiveBlurTypeSelect: getElement<HTMLSelectElement>('progressiveBlurType'),
    glassThemeSelect: getElement<HTMLSelectElement>('glassTheme'),
    glassBgOpacitySlider: getElement<HTMLInputElement>('glassBgOpacity'),
    pressedGlassBgOpacitySlider: getElement<HTMLInputElement>('pressedGlassBgOpacity'),
    liquidEnabledCheckbox: getElement<HTMLInputElement>('liquidEnabled'),
    liquidPressScaleSlider: getElement<HTMLInputElement>('liquidPressScale'),
    liquidPressRefractionSlider: getElement<HTMLInputElement>('liquidPressRefraction'),
    liquidSpeedSlider: getElement<HTMLInputElement>('liquidSpeed'),
    liquidClickSquashSlider: getElement<HTMLInputElement>('liquidClickSquash'),
    liquidDragSquashSlider: getElement<HTMLInputElement>('liquidDragSquash'),
    liquidReleaseSquashSlider: getElement<HTMLInputElement>('liquidReleaseSquash'),
    shadowOpacitySlider: getElement<HTMLInputElement>('shadowOpacity'),
    shadowBlurSlider: getElement<HTMLInputElement>('shadowBlur'),
    shadowOffsetXSlider: getElement<HTMLInputElement>('shadowOffsetX'),
    shadowOffsetYSlider: getElement<HTMLInputElement>('shadowOffsetY'),
    surfaceButtons: document.querySelectorAll<HTMLButtonElement>('.surface-btn'),
    circleOnlyControls: document.querySelectorAll<HTMLElement>('.circle-only-control'),
    iconOnlyControls: document.querySelectorAll<HTMLElement>('.icon-only-control'),
    rectOnlyControls: document.querySelectorAll<HTMLElement>('.rect-only-control'),
    switchOnlyControls: document.querySelectorAll<HTMLElement>('.switch-only-control'),
    gridOnlyControls: document.querySelectorAll<HTMLElement>('.grid-only-control'),
  }
}

export function setSliderValue(slider: HTMLInputElement, value: number): void {
  slider.value = String(value)
}

export function setupCollapsibleSections(onDisplacementOpen: () => void): void {
  document.querySelectorAll<HTMLButtonElement>('.section-header').forEach((header) => {
    header.addEventListener('click', () => {
      const section = header.closest<HTMLElement>('.panel-section')
      if (!section) return

      const collapsed = section.classList.toggle('collapsed')
      header.setAttribute('aria-expanded', String(!collapsed))

      if (!collapsed && section.classList.contains('displacement-section')) {
        onDisplacementOpen()
      }
    })
  })
}
