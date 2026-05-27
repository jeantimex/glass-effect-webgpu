import type { SurfaceType } from './displacement-map'
import type { BackgroundType, WebGPURenderer } from '../webgpu/renderer'
import type { GlassControls } from './dom'
import { setSliderValue } from './dom'
import { getPresetDefinition } from '../presets'
import type { GlassSprings } from './springs'
import { resetDeformationSprings, resetGlassSpringsFromPreset, setSpring } from './springs'
import type { GlassTheme, PresetType, UserParams } from './types'
import { surfaceTypeMap } from './types'

interface ControlPanelOptions {
  controls: GlassControls
  renderer: WebGPURenderer
  userParams: UserParams
  springs: GlassSprings
  setCurrentPreset: (preset: PresetType) => void
  getCurrentPreset: () => PresetType
  setCurrentSurfaceType: (surfaceType: SurfaceType) => void
  updateDisplacementMap: () => void
}

export class GlassControlPanel {
  constructor(private options: ControlPanelOptions) {}

  setup(): void {
    this.updateShapeControls()
    this.updateIconControls()
    this.updateBackgroundControls()
    this.updateGlassTheme()
    this.updateSpecularControls()
    this.updateChromaticControls()
    this.bindEvents()
  }

  setCircleSize(size: number): void {
    const { controls, userParams } = this.options
    const clampedSize = Math.min(Math.max(size, parseFloat(controls.circleSizeSlider.min)), parseFloat(controls.circleSizeSlider.max))
    userParams.circleSize = clampedSize
    controls.circleSizeSlider.value = clampedSize.toFixed(2)
  }

  setRectWidth(width: number): void {
    const { controls, renderer } = this.options
    const clampedWidth = Math.min(Math.max(width, parseFloat(controls.rectWidthSlider.min)), parseFloat(controls.rectWidthSlider.max))
    renderer.glassParams.rectWidth = clampedWidth
    controls.rectWidthSlider.value = String(clampedWidth)
  }

  setRectHeight(height: number): void {
    const { controls, renderer } = this.options
    const clampedHeight = Math.min(Math.max(height, parseFloat(controls.rectHeightSlider.min)), parseFloat(controls.rectHeightSlider.max))
    renderer.glassParams.rectHeight = clampedHeight
    controls.rectHeightSlider.value = String(clampedHeight)
  }

  applyPreset(type: PresetType): void {
    const definition = getPresetDefinition(type)
    const preset = definition.config
    const { controls, renderer, setCurrentPreset, setCurrentSurfaceType, springs, updateDisplacementMap, userParams } = this.options

    setCurrentPreset(type)
    renderer.glassParams.shapeType = preset.shapeType
    renderer.setSwitchMode(definition.isSwitchMode)
    renderer.setSliderMode(definition.isSliderMode)
    renderer.glassParams.playerControlsMode = definition.isPlayerControlsMode
    if (type === 'panel' || type === 'player-controls') {
      renderer.centerGlass()
    }
    setCurrentSurfaceType(preset.surfaceType)
    renderer.glassParams.surfaceType = surfaceTypeMap[preset.surfaceType]
    renderer.glassParams.bezelWidth = preset.bezelWidth
    renderer.glassParams.glassThickness = preset.glassThickness
    renderer.glassParams.refractiveIndex = preset.refractiveIndex
    renderer.glassParams.magnifyingScale = preset.magnifyingScale
    renderer.glassParams.circleSize = preset.circleSize
    renderer.glassParams.rectWidth = preset.rectWidth
    renderer.glassParams.rectHeight = preset.rectHeight
    renderer.glassParams.rectRadiusPercent = preset.rectRadiusPercent
    renderer.glassParams.switchTrackWidth = preset.switchTrackWidth
    renderer.glassParams.switchTrackHeight = preset.switchTrackHeight
    renderer.glassParams.switchTrackOffOpacity = preset.switchTrackOffOpacity
    renderer.glassParams.switchTrackOnOpacity = preset.switchTrackOnOpacity
    renderer.glassParams.maxDisplacementScale = preset.maxDisplacementScale
    renderer.setSwitchProgress(preset.trackProgress)
    renderer.glassParams.scaleRatio = preset.scaleRatio
    renderer.glassParams.blurAmount = preset.blurAmount
    renderer.glassParams.blurType = preset.blurType
    renderer.glassParams.progressiveBlur = preset.progressiveBlur
    renderer.glassParams.progressiveBlurType = preset.progressiveBlurType
    renderer.glassParams.glassBgOpacity = preset.glassBgOpacity
    renderer.glassParams.specularType = preset.specularType
    renderer.glassParams.specularOpacity = preset.specularOpacity
    renderer.glassParams.specularAngle = preset.specularAngle * Math.PI / 180
    renderer.glassParams.specularSaturation = preset.specularSaturation
    renderer.glassParams.shadowOpacity = preset.shadowOpacity
    renderer.glassParams.shadowBlur = preset.shadowBlur
    renderer.glassParams.shadowOffsetX = preset.shadowOffsetX
    renderer.glassParams.shadowOffsetY = preset.shadowOffsetY

    userParams.splitMenuOpen = false
    userParams.splitMenuProgress = 0
    applyPresetToUserParams(userParams, preset)
    resetGlassSpringsFromPreset(springs, preset)

    controls.surfaceButtons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-surface') === preset.surfaceType)
    })
    setSliderValue(controls.bezelSlider, preset.bezelWidth)
    setSliderValue(controls.thicknessSlider, preset.glassThickness)
    setSliderValue(controls.refractiveIndexSlider, preset.refractiveIndex)
    setSliderValue(controls.magnifyingScaleSlider, preset.magnifyingScale)
    setSliderValue(controls.circleSizeSlider, preset.circleSize)
    setSliderValue(controls.rectWidthSlider, preset.rectWidth)
    setSliderValue(controls.rectHeightSlider, preset.rectHeight)
    setSliderValue(controls.rectRadiusSlider, preset.rectRadiusPercent)
    setSliderValue(controls.switchTrackWidthSlider, preset.switchTrackWidth)
    setSliderValue(controls.switchTrackHeightSlider, preset.switchTrackHeight)
    setSliderValue(controls.switchTrackOffOpacitySlider, preset.switchTrackOffOpacity)
    setSliderValue(controls.switchTrackOnOpacitySlider, preset.switchTrackOnOpacity)
    setSliderValue(controls.scaleSlider, preset.scaleRatio)
    controls.specularTypeSelect.value = String(preset.specularType)
    controls.blurTypeSelect.value = String(preset.blurType)
    setSliderValue(controls.blurAmountSlider, preset.blurAmount)
    setSliderValue(controls.progressiveBlurSlider, preset.progressiveBlur)
    controls.progressiveBlurTypeSelect.value = String(preset.progressiveBlurType)
    setSliderValue(controls.glassBgOpacitySlider, preset.glassBgOpacity)
    setSliderValue(controls.pressedGlassBgOpacitySlider, preset.pressedGlassBgOpacity)
    setSliderValue(controls.liquidPressScaleSlider, preset.liquidPressScale)
    setSliderValue(controls.liquidPressRefractionSlider, preset.liquidPressRefraction)
    setSliderValue(controls.liquidClickSquashSlider, preset.liquidClickSquash)
    setSliderValue(controls.liquidDragSquashSlider, preset.liquidDragSquash)
    setSliderValue(controls.liquidReleaseSquashSlider, preset.liquidReleaseSquash)
    setSliderValue(controls.liquidSpeedSlider, preset.liquidSpeed)
    setSliderValue(controls.specularOpacitySlider, preset.specularOpacity)
    setSliderValue(controls.specularAngleSlider, preset.specularAngle)
    setSliderValue(controls.specularSaturationSlider, preset.specularSaturation)
    setSliderValue(controls.shadowOpacitySlider, preset.shadowOpacity)
    setSliderValue(controls.shadowBlurSlider, preset.shadowBlur)
    setSliderValue(controls.shadowOffsetXSlider, preset.shadowOffsetX)
    setSliderValue(controls.shadowOffsetYSlider, preset.shadowOffsetY)
    
    if (!definition.supportsIcon) {
      renderer.glassParams.iconType = 0
      renderer.setIcon(null).catch(console.error)
      controls.iconTypeSelect.value = 'none'
    } else if (definition.isPlayerControlsMode) {
      renderer.glassParams.iconType = 1
      renderer.setIcon(`${import.meta.env.BASE_URL}assets/icons/pause.svg`).catch(console.error)
      controls.iconTypeSelect.value = 'pause'
    }

    this.updateShapeControls()
    this.updateIconControls()
    updateDisplacementMap()
  }

  private bindEvents(): void {
    const { controls, renderer, setCurrentSurfaceType, updateDisplacementMap, userParams, springs } = this.options

    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    colorSchemeQuery.addEventListener('change', () => {
      if (controls.glassThemeSelect.value === 'system') this.updateGlassTheme()
    })

    controls.presetSelect.addEventListener('change', () => {
      this.applyPreset(controls.presetSelect.value as PresetType)
    })

    controls.surfaceButtons.forEach((button) => {
      button.addEventListener('click', () => {
        controls.surfaceButtons.forEach((item) => item.classList.remove('active'))
        button.classList.add('active')
        const surfaceType = button.getAttribute('data-surface') as SurfaceType
        setCurrentSurfaceType(surfaceType)
        renderer.glassParams.surfaceType = surfaceTypeMap[surfaceType]
        updateDisplacementMap()
      })
    })

    controls.bezelSlider.addEventListener('input', () => {
      renderer.glassParams.bezelWidth = parseInt(controls.bezelSlider.value)
      updateDisplacementMap()
    })
    controls.thicknessSlider.addEventListener('input', () => {
      renderer.glassParams.glassThickness = parseInt(controls.thicknessSlider.value)
      updateDisplacementMap()
    })
    controls.refractiveIndexSlider.addEventListener('input', () => {
      renderer.glassParams.refractiveIndex = parseFloat(controls.refractiveIndexSlider.value)
      updateDisplacementMap()
    })
    controls.scaleSlider.addEventListener('input', () => {
      userParams.scaleRatio = parseFloat(controls.scaleSlider.value)
      updateDisplacementMap()
    })
    controls.magnifyingScaleSlider.addEventListener('input', () => {
      userParams.magnifyingScale = parseFloat(controls.magnifyingScaleSlider.value)
    })
    controls.circleSizeSlider.addEventListener('input', () => {
      this.setCircleSize(parseFloat(controls.circleSizeSlider.value))
    })
    controls.rectWidthSlider.addEventListener('input', () => {
      this.setRectWidth(parseFloat(controls.rectWidthSlider.value))
    })
    controls.rectHeightSlider.addEventListener('input', () => {
      this.setRectHeight(parseFloat(controls.rectHeightSlider.value))
    })
    controls.rectRadiusSlider.addEventListener('input', () => {
      renderer.glassParams.rectRadiusPercent = parseFloat(controls.rectRadiusSlider.value)
    })
    controls.iconTypeSelect.addEventListener('change', () => {
      const icon = controls.iconTypeSelect.value
      if (icon === 'none') {
        renderer.glassParams.iconType = 0
        renderer.setIcon(null).catch(console.error)
      } else {
        renderer.glassParams.iconType = 1
        renderer.setIcon(`${import.meta.env.BASE_URL}assets/icons/${icon}.svg`).catch(console.error)
      }
      this.updateIconControls()
    })
    controls.iconOpacitySlider.addEventListener('input', () => {
      renderer.glassParams.iconOpacity = parseFloat(controls.iconOpacitySlider.value)
    })
    controls.iconScaleSlider.addEventListener('input', () => {
      renderer.glassParams.iconScale = parseFloat(controls.iconScaleSlider.value)
    })
    controls.iconColorInput.addEventListener('input', () => {
      const hex = controls.iconColorInput.value
      renderer.glassParams.iconColorR = parseInt(hex.slice(1, 3), 16) / 255
      renderer.glassParams.iconColorG = parseInt(hex.slice(3, 5), 16) / 255
      renderer.glassParams.iconColorB = parseInt(hex.slice(5, 7), 16) / 255
    })
    controls.switchTrackWidthSlider.addEventListener('input', () => {
      renderer.glassParams.switchTrackWidth = parseFloat(controls.switchTrackWidthSlider.value)
      this.syncTrackProgress()
    })
    controls.switchTrackHeightSlider.addEventListener('input', () => {
      renderer.glassParams.switchTrackHeight = parseFloat(controls.switchTrackHeightSlider.value)
      this.syncTrackProgress()
    })
    controls.switchTrackOffOpacitySlider.addEventListener('input', () => {
      renderer.glassParams.switchTrackOffOpacity = parseFloat(controls.switchTrackOffOpacitySlider.value)
    })
    controls.switchTrackOnOpacitySlider.addEventListener('input', () => {
      renderer.glassParams.switchTrackOnOpacity = parseFloat(controls.switchTrackOnOpacitySlider.value)
    })
    controls.forceActiveCheckbox.addEventListener('change', () => {
      userParams.forceActive = controls.forceActiveCheckbox.checked
    })

    controls.backgroundTypeSelect.addEventListener('change', () => {
      const bgType = controls.backgroundTypeSelect.value as BackgroundType
      const articleEl = bgType === 'article' ? controls.articleBackground : undefined
      renderer.setBackground(bgType, articleEl).catch(console.error)
      this.updateBackgroundControls()
    })
    controls.gridCellSizeSlider.addEventListener('input', () => {
      renderer.glassParams.gridCellSize = parseFloat(controls.gridCellSizeSlider.value)
    })
    controls.gridSpeedSlider.addEventListener('input', () => {
      renderer.setGridSpeed(parseFloat(controls.gridSpeedSlider.value))
    })
    controls.bgBrightnessSlider.addEventListener('input', () => {
      renderer.glassParams.bgBrightness = parseFloat(controls.bgBrightnessSlider.value)
    })

    controls.specularOpacitySlider.addEventListener('input', () => {
      userParams.specularOpacity = parseFloat(controls.specularOpacitySlider.value)
    })
    controls.specularAngleSlider.addEventListener('input', () => {
      renderer.glassParams.specularAngle = parseFloat(controls.specularAngleSlider.value) * Math.PI / 180
    })
    controls.specularSaturationSlider.addEventListener('input', () => {
      renderer.glassParams.specularSaturation = parseFloat(controls.specularSaturationSlider.value)
    })
    controls.specularTypeSelect.addEventListener('change', () => {
      renderer.glassParams.specularType = parseFloat(controls.specularTypeSelect.value)
      this.updateSpecularControls()
    })

    controls.blurTypeSelect.addEventListener('change', () => {
      renderer.glassParams.blurType = parseFloat(controls.blurTypeSelect.value)
    })
    controls.blurAmountSlider.addEventListener('input', () => {
      renderer.glassParams.blurAmount = parseFloat(controls.blurAmountSlider.value)
    })
    controls.progressiveBlurSlider.addEventListener('input', () => {
      renderer.glassParams.progressiveBlur = parseFloat(controls.progressiveBlurSlider.value)
    })
    controls.progressiveBlurTypeSelect.addEventListener('change', () => {
      renderer.glassParams.progressiveBlurType = parseFloat(controls.progressiveBlurTypeSelect.value)
    })
    controls.glassThemeSelect.addEventListener('change', () => this.updateGlassTheme())
    controls.glassBgColorInput.addEventListener('input', () => {
      const hex = controls.glassBgColorInput.value
      renderer.glassParams.glassTintR = parseInt(hex.slice(1, 3), 16) / 255
      renderer.glassParams.glassTintG = parseInt(hex.slice(3, 5), 16) / 255
      renderer.glassParams.glassTintB = parseInt(hex.slice(5, 7), 16) / 255
    })
    controls.glassBgOpacitySlider.addEventListener('input', () => {
      userParams.glassBgOpacity = parseFloat(controls.glassBgOpacitySlider.value)
    })
    controls.pressedGlassBgOpacitySlider.addEventListener('input', () => {
      userParams.pressedGlassBgOpacity = parseFloat(controls.pressedGlassBgOpacitySlider.value)
    })

    controls.liquidEnabledCheckbox.addEventListener('change', () => {
      userParams.liquidEnabled = controls.liquidEnabledCheckbox.checked
      springs.liquid.value = 0
      springs.liquid.target = 0
      springs.liquid.velocity = 0
      resetDeformationSprings(springs)
      setSpring(springs.scale, userParams.circleSize)
    })
    controls.liquidPressScaleSlider.addEventListener('input', () => {
      userParams.liquidPressScale = parseFloat(controls.liquidPressScaleSlider.value)
    })
    controls.liquidPressRefractionSlider.addEventListener('input', () => {
      userParams.liquidPressRefraction = parseFloat(controls.liquidPressRefractionSlider.value)
    })
    controls.liquidSpeedSlider.addEventListener('input', () => {
      userParams.liquidSpeed = parseFloat(controls.liquidSpeedSlider.value)
    })
    controls.liquidClickSquashSlider.addEventListener('input', () => {
      userParams.liquidClickSquash = parseFloat(controls.liquidClickSquashSlider.value)
    })
    controls.liquidDragSquashSlider.addEventListener('input', () => {
      userParams.liquidDragSquash = parseFloat(controls.liquidDragSquashSlider.value)
    })
    controls.liquidReleaseSquashSlider.addEventListener('input', () => {
      userParams.liquidReleaseSquash = parseFloat(controls.liquidReleaseSquashSlider.value)
    })

    controls.shadowOpacitySlider.addEventListener('input', () => {
      userParams.shadowOpacity = parseFloat(controls.shadowOpacitySlider.value)
    })
    controls.shadowBlurSlider.addEventListener('input', () => {
      userParams.shadowBlur = parseFloat(controls.shadowBlurSlider.value)
    })
    controls.shadowOffsetXSlider.addEventListener('input', () => {
      userParams.shadowOffsetX = parseFloat(controls.shadowOffsetXSlider.value)
    })
    controls.shadowOffsetYSlider.addEventListener('input', () => {
      userParams.shadowOffsetY = parseFloat(controls.shadowOffsetYSlider.value)
    })

    controls.chromaticAberrationCheckbox.addEventListener('change', () => {
      renderer.glassParams.chromaticAberration = controls.chromaticAberrationCheckbox.checked
      this.updateChromaticControls()
    })
    controls.chromaticStrengthSlider.addEventListener('input', () => {
      renderer.glassParams.chromaticStrength = parseFloat(controls.chromaticStrengthSlider.value)
    })
    controls.chromaticBaseSlider.addEventListener('input', () => {
      renderer.glassParams.chromaticBase = parseFloat(controls.chromaticBaseSlider.value)
    })
  }

  private syncTrackProgress(): void {
    const { renderer, getCurrentPreset } = this.options
    const preset = getCurrentPreset()
    if (preset === 'switch' || preset === 'slider') {
      renderer.setSwitchProgress(renderer.getSwitchProgress())
    }
  }

  private updateShapeControls(): void {
    const { controls, renderer, getCurrentPreset } = this.options
    const isRectangle = renderer.glassParams.shapeType === 1
    const preset = getCurrentPreset()
    const isTrackPreset = preset === 'switch' || preset === 'slider'
    controls.circleOnlyControls.forEach((control) => control.classList.toggle('hidden', isRectangle))
    controls.rectOnlyControls.forEach((control) => control.classList.toggle('hidden', !isRectangle))
    controls.switchOnlyControls.forEach((control) => control.classList.toggle('hidden', !isTrackPreset))
  }

  private updateIconControls(): void {
    const { controls, renderer, getCurrentPreset } = this.options
    const definition = getPresetDefinition(getCurrentPreset())
    const supportsIcon = definition.supportsIcon
    const hasIcon = renderer.glassParams.iconType > 0

    // Hide icon type selector for presets that don't support icons
    const iconTypeRow = controls.iconTypeSelect.closest<HTMLElement>('.control-row')
    iconTypeRow?.classList.toggle('hidden', !supportsIcon)

    // Hide icon settings when no icon is selected or preset doesn't support icons
    controls.iconOnlyControls.forEach((control) => control.classList.toggle('hidden', !hasIcon || !supportsIcon))
  }

  private updateBackgroundControls(): void {
    const { controls } = this.options
    const bgType = controls.backgroundTypeSelect.value
    const isGrid = bgType === 'grid'
    controls.gridOnlyControls.forEach((control) => control.classList.toggle('hidden', !isGrid))
    // Article background is always hidden - we capture it to texture
    controls.articleBackground.classList.add('hidden')
  }

  private resolveGlassTheme(): Exclude<GlassTheme, 'system'> {
    const selectedTheme = this.options.controls.glassThemeSelect.value as GlassTheme
    if (selectedTheme === 'light' || selectedTheme === 'dark' || selectedTheme === 'custom') return selectedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  private updateGlassTheme(): void {
    const { controls, renderer } = this.options
    const resolvedTheme = this.resolveGlassTheme()

    if (resolvedTheme === 'custom') {
      // Custom: use current color picker value
    } else if (resolvedTheme === 'dark') {
      controls.glassBgColorInput.value = '#222222'
    } else {
      controls.glassBgColorInput.value = '#ffffff'
    }

    const hex = controls.glassBgColorInput.value
    renderer.glassParams.glassTintR = parseInt(hex.slice(1, 3), 16) / 255
    renderer.glassParams.glassTintG = parseInt(hex.slice(3, 5), 16) / 255
    renderer.glassParams.glassTintB = parseInt(hex.slice(5, 7), 16) / 255
  }

  private updateSpecularControls(): void {
    const { controls, renderer } = this.options
    const isLayeredSpecular = renderer.glassParams.specularType === 1
    const saturationRow = controls.specularSaturationSlider.closest<HTMLElement>('.control-row')
    saturationRow?.classList.toggle('hidden', isLayeredSpecular)
  }

  private updateChromaticControls(): void {
    const { controls, renderer } = this.options
    const enabled = renderer.glassParams.chromaticAberration
    controls.chromaticOnlyControls.forEach((control) => control.classList.toggle('hidden', !enabled))
  }
}

function applyPresetToUserParams(userParams: UserParams, preset: {
  circleSize: number
  scaleRatio: number
  magnifyingScale: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  specularOpacity: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number
  liquidPressScale: number
  liquidPressRefraction: number
  liquidClickSquash: number
  liquidDragSquash: number
  liquidReleaseSquash: number
  liquidSpeed: number
}): void {
  userParams.circleSize = preset.circleSize
  userParams.scaleRatio = preset.scaleRatio
  userParams.magnifyingScale = preset.magnifyingScale
  userParams.shadowOpacity = preset.shadowOpacity
  userParams.shadowBlur = preset.shadowBlur
  userParams.shadowOffsetX = preset.shadowOffsetX
  userParams.shadowOffsetY = preset.shadowOffsetY
  userParams.specularOpacity = preset.specularOpacity
  userParams.glassBgOpacity = preset.glassBgOpacity
  userParams.pressedGlassBgOpacity = preset.pressedGlassBgOpacity
  userParams.liquidPressScale = preset.liquidPressScale
  userParams.liquidPressRefraction = preset.liquidPressRefraction
  userParams.liquidClickSquash = preset.liquidClickSquash
  userParams.liquidDragSquash = preset.liquidDragSquash
  userParams.liquidReleaseSquash = preset.liquidReleaseSquash
  userParams.liquidSpeed = preset.liquidSpeed
}
