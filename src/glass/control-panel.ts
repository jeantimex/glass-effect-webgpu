import type { SurfaceType } from './displacement-map'
import type { BackgroundType, WebGPURenderer, GlassInstance, CircleInstance, RectangleInstance } from '../webgpu/renderer'
import type { GlassControls } from './dom'
import { setSliderValue } from './dom'
import { getPresetDefinition } from '../presets'
import type { GlassSprings } from './springs'
import { resetDeformationSprings, resetGlassSpringsFromPreset, setSpring } from './springs'
import type { CirclePresetStrategy, GlassTheme, PresetType, UserParams } from './types'
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

  private isCirclePresetMode(): boolean {
    const preset = this.options.getCurrentPreset()
    return preset === 'circle-lens' || preset === 'rectangle' || preset === 'basic-shape'
  }

  private getActiveInstance(): GlassInstance | undefined {
    if (!this.isCirclePresetMode()) return undefined
    return this.options.renderer.getActiveGlassInstance()
  }

  private getActiveCircleInstance(): CircleInstance | undefined {
    if (!this.isCirclePresetMode()) return undefined
    return this.options.renderer.getActiveCircleInstance()
  }

  private getActiveRectangleInstance(): RectangleInstance | undefined {
    if (!this.isCirclePresetMode()) return undefined
    return this.options.renderer.getActiveRectangleInstance()
  }

  private updateInstanceProperty(update: (instance: GlassInstance) => void): void {
    const instance = this.getActiveInstance()
    if (instance) {
      update(instance)
    }
  }

  private updateRectangleInstanceProperty(update: (instance: RectangleInstance) => void): void {
    const instance = this.getActiveRectangleInstance()
    if (instance) {
      update(instance)
    }
  }

  private updateCircleInstanceProperty(update: (instance: CircleInstance) => void): void {
    const instance = this.getActiveCircleInstance()
    if (instance) {
      update(instance)
    }
  }

  setup(): void {
    const { controls, renderer } = this.options

    const drawerQuery = window.matchMedia('(max-width: 1100px)')
    this.setPanelDrawerOpen(!drawerQuery.matches)
    drawerQuery.addEventListener('change', (event) => {
      this.setPanelDrawerOpen(!event.matches)
    })
    this.updateShapeControls()
    this.updateIconControls()
    this.updateBackgroundControls()
    this.updateGlassTheme()
    this.updateSpecularControls()
    this.updateChromaticControls()
    this.bindEvents()
    renderer.setBackground(controls.backgroundTypeSelect.value as BackgroundType).catch(console.error)
    this.applyPreset(controls.presetSelect.value as PresetType)
  }

  setPanelDrawerOpen(open: boolean): void {
    const { controls } = this.options
    controls.appRoot.classList.toggle('panel-drawer-open', open)
    controls.controlPanel.toggleAttribute('inert', !open)
    controls.controlPanel.setAttribute('aria-hidden', String(!open))
    controls.panelBackdrop.setAttribute('aria-hidden', String(!open))
    controls.panelToggleButton.setAttribute('aria-expanded', String(open))
    controls.panelToggleButton.setAttribute('aria-label', open ? 'Close controls' : 'Open controls')
  }

  private togglePanelDrawer(): void {
    const { controls } = this.options
    const open = !controls.appRoot.classList.contains('panel-drawer-open')
    this.setPanelDrawerOpen(open)
  }

  setCircleSize(size: number): void {
    const { controls, userParams } = this.options
    const clampedSize = Math.min(Math.max(size, parseFloat(controls.circleSizeSlider.min)), parseFloat(controls.circleSizeSlider.max))
    userParams.circleSize = clampedSize
    controls.circleSizeSlider.value = clampedSize.toFixed(2)
    const preset = this.options.getCurrentPreset()
    if (preset === 'circle-lens' || preset === 'basic-shape') {
      const renderer = this.options.renderer
      const activeIndex = renderer.getCirclePresetActiveIndex()
      // Only update if active instance is a circle
      const circleInstance = renderer.getCirclePresetCircle(activeIndex)
      if (circleInstance) {
        renderer.setCirclePresetCircleSize(activeIndex, clampedSize)
      }
    }
  }

  setRectWidth(width: number): void {
    const { controls, renderer } = this.options
    const clampedWidth = Math.min(Math.max(width, parseFloat(controls.rectWidthSlider.min)), parseFloat(controls.rectWidthSlider.max))
    renderer.glassParams.rectWidth = clampedWidth
    controls.rectWidthSlider.value = String(clampedWidth)
    this.updateRectangleInstanceProperty(inst => inst.rectWidth = clampedWidth)
    this.updateRectRadius()
  }

  setRectHeight(height: number): void {
    const { controls, renderer } = this.options
    const clampedHeight = Math.min(Math.max(height, parseFloat(controls.rectHeightSlider.min)), parseFloat(controls.rectHeightSlider.max))
    renderer.glassParams.rectHeight = clampedHeight
    controls.rectHeightSlider.value = String(clampedHeight)
    this.updateRectangleInstanceProperty(inst => inst.rectHeight = clampedHeight)
    this.updateRectRadius()
  }

  private updateRectRadius(): void {
    const { controls, renderer } = this.options
    const radiusPercent = parseFloat(controls.rectRadiusSlider.value)
    const minDim = Math.min(renderer.glassParams.rectWidth, renderer.glassParams.rectHeight)
    const radiusPixels = (radiusPercent / 100) * minDim * 0.5
    this.updateRectangleInstanceProperty(inst => inst.rectRadius = radiusPixels)
  }

  syncSlidersFromActiveInstance(): void {
    const { controls, renderer, userParams } = this.options
    const circleInstance = this.getActiveCircleInstance()
    const rectInstance = this.getActiveRectangleInstance()
    const instance = circleInstance ?? rectInstance
    if (!instance) return

    // Common properties
    setSliderValue(controls.bezelSlider, instance.bezelWidth)
    setSliderValue(controls.thicknessSlider, instance.glassThickness)
    setSliderValue(controls.refractiveIndexSlider, instance.refractiveIndex)
    setSliderValue(controls.magnifyingScaleSlider, instance.magnifyingScale)
    setSliderValue(controls.scaleSlider, instance.scaleRatio)
    setSliderValue(controls.blurAmountSlider, instance.blurAmount)
    setSliderValue(controls.progressiveBlurSlider, instance.progressiveBlur)
    setSliderValue(controls.glassBgOpacitySlider, instance.glassBgOpacity)
    setSliderValue(controls.pressedGlassBgOpacitySlider, instance.pressedGlassBgOpacity)
    setSliderValue(controls.specularOpacitySlider, instance.specularOpacity)
    setSliderValue(controls.specularAngleSlider, instance.specularAngle * 180 / Math.PI)
    setSliderValue(controls.specularSaturationSlider, instance.specularSaturation)
    setSliderValue(controls.shadowOpacitySlider, instance.shadowOpacity)
    setSliderValue(controls.shadowBlurSlider, instance.shadowBlur)
    setSliderValue(controls.shadowOffsetXSlider, instance.shadowOffsetX)
    setSliderValue(controls.shadowOffsetYSlider, instance.shadowOffsetY)
    setSliderValue(controls.chromaticStrengthSlider, instance.chromaticStrength)
    setSliderValue(controls.chromaticBaseSlider, instance.chromaticBase)

    // Shape-specific properties
    if (rectInstance) {
      setSliderValue(controls.rectWidthSlider, rectInstance.rectWidth)
      setSliderValue(controls.rectHeightSlider, rectInstance.rectHeight)
      const minDim = Math.min(rectInstance.rectWidth, rectInstance.rectHeight)
      const radiusPercent = (rectInstance.rectRadius / (minDim * 0.5)) * 100
      setSliderValue(controls.rectRadiusSlider, radiusPercent)
      renderer.glassParams.rectWidth = rectInstance.rectWidth
      renderer.glassParams.rectHeight = rectInstance.rectHeight
      renderer.glassParams.rectRadiusPercent = radiusPercent
      renderer.glassParams.circleSize = 1
    } else if (circleInstance) {
      setSliderValue(controls.circleSizeSlider, circleInstance.size)
      setSliderValue(controls.iconOpacitySlider, circleInstance.iconOpacity)
      setSliderValue(controls.iconScaleSlider, circleInstance.iconScale)
      renderer.glassParams.circleSize = circleInstance.size
      renderer.glassParams.iconOpacity = circleInstance.iconOpacity
      renderer.glassParams.iconScale = circleInstance.iconScale
    }
    renderer.glassParams.bezelWidth = instance.bezelWidth
    renderer.glassParams.glassThickness = instance.glassThickness
    renderer.glassParams.refractiveIndex = instance.refractiveIndex
    renderer.glassParams.magnifyingScale = instance.magnifyingScale
    renderer.glassParams.scaleRatio = instance.scaleRatio
    renderer.glassParams.blurAmount = instance.blurAmount
    renderer.glassParams.progressiveBlur = instance.progressiveBlur
    renderer.glassParams.glassBgOpacity = instance.glassBgOpacity
    userParams.pressedGlassBgOpacity = instance.pressedGlassBgOpacity
    renderer.glassParams.specularOpacity = instance.specularOpacity
    renderer.glassParams.specularAngle = instance.specularAngle
    renderer.glassParams.specularSaturation = instance.specularSaturation
    renderer.glassParams.shadowOpacity = instance.shadowOpacity
    renderer.glassParams.shadowBlur = instance.shadowBlur
    renderer.glassParams.shadowOffsetX = instance.shadowOffsetX
    renderer.glassParams.shadowOffsetY = instance.shadowOffsetY
    renderer.glassParams.chromaticStrength = instance.chromaticStrength
    renderer.glassParams.chromaticBase = instance.chromaticBase
    renderer.glassParams.glassTintR = instance.glassTintR
    renderer.glassParams.glassTintG = instance.glassTintG
    renderer.glassParams.glassTintB = instance.glassTintB
    renderer.glassParams.surfaceType = instance.surfaceType

    // Update color picker to match instance
    const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
    controls.glassBgColorInput.value = `#${toHex(instance.glassTintR)}${toHex(instance.glassTintG)}${toHex(instance.glassTintB)}`

    // Update surface buttons to match instance
    const surfaceNames: SurfaceType[] = ['convex-circle', 'convex-squircle', 'concave', 'lip']
    const surfaceName = surfaceNames[instance.surfaceType] ?? 'convex-circle'
    controls.surfaceButtons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-surface') === surfaceName)
    })

    // Update select elements to match instance
    controls.blurTypeSelect.value = String(instance.blurType)
    controls.progressiveBlurTypeSelect.value = String(instance.progressiveBlurType)
    controls.specularTypeSelect.value = String(instance.specularType)
    renderer.glassParams.blurType = instance.blurType
    renderer.glassParams.progressiveBlurType = instance.progressiveBlurType
    renderer.glassParams.specularType = instance.specularType
    this.updateSpecularControls()

    // Update glass theme - detect if it matches light/dark or set to custom
    const isWhite = instance.glassTintR === 1 && instance.glassTintG === 1 && instance.glassTintB === 1
    const isDark = Math.abs(instance.glassTintR - 0.133) < 0.01 &&
                   Math.abs(instance.glassTintG - 0.133) < 0.01 &&
                   Math.abs(instance.glassTintB - 0.133) < 0.01
    if (isWhite) {
      controls.glassThemeSelect.value = 'light'
    } else if (isDark) {
      controls.glassThemeSelect.value = 'dark'
    } else {
      controls.glassThemeSelect.value = 'custom'
    }

    this.updateShapeControls()
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
    if (definition.isPlayerControlsMode) {
      renderer.glassParams.leftCircleSize = 0.32
      renderer.glassParams.centerCircleSize = 0.42
      renderer.glassParams.rightCircleSize = 0.32
    }
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
    renderer.setCirclePresetStrategy(0)
    const isInstancePreset = type === 'circle-lens' || type === 'rectangle' || type === 'basic-shape'
    renderer.glassParams.circlePresetMode = isInstancePreset
    if (isInstancePreset) {
      // Set mixed mode for basic-shape preset
      renderer.setMixedMode(type === 'basic-shape')
      renderer.resetCirclePresetCircles()
      controls.circlePresetStrategySelect.value = 'stack'
      if (type === 'circle-lens') {
        const circleInstance = renderer.getCirclePresetCircle(0)
        setSliderValue(controls.circleSizeSlider, circleInstance.size)
        const icon = controls.iconTypeSelect.value
        const iconUrl = icon === 'none' ? null : `${import.meta.env.BASE_URL}assets/icons/${icon}.svg`
        void renderer.setCirclePresetIcon(iconUrl)
        renderer.setIcon(iconUrl).catch(console.error)
      } else if (type === 'basic-shape') {
        // Basic shape starts with circle by default
        controls.basicShapeTypeSelect.value = 'circle'
        const circleInstance = renderer.getCirclePresetCircle(0)
        if (circleInstance) {
          setSliderValue(controls.circleSizeSlider, circleInstance.size)
        }
        void renderer.setCirclePresetIcon(null)
      } else {
        // Rectangle preset - no icon, no circle size slider
        void renderer.setCirclePresetIcon(null)
      }
    }

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
      renderer.setIconLeft(null).catch(console.error)
      renderer.setIconRight(null).catch(console.error)
      controls.iconTypeSelect.value = 'none'
    } else if (definition.isPlayerControlsMode) {
      renderer.glassParams.iconType = 1
      // Load icons based on dropdown selections using Circle class
      const leftIcon = controls.leftIconTypeSelect.value
      const centerIcon = controls.centerIconTypeSelect.value
      const rightIcon = controls.rightIconTypeSelect.value

      const leftCircle = renderer.getCircle(0)
      const centerCircle = renderer.getCircle(1)
      const rightCircle = renderer.getCircle(2)

      leftCircle.setIcon(leftIcon === 'none' ? null : `${import.meta.env.BASE_URL}assets/icons/${leftIcon}.svg`).catch(console.error)
      renderer.setIcon(centerIcon === 'none' ? null : `${import.meta.env.BASE_URL}assets/icons/${centerIcon}.svg`).catch(console.error)
      rightCircle.setIcon(rightIcon === 'none' ? null : `${import.meta.env.BASE_URL}assets/icons/${rightIcon}.svg`).catch(console.error)

      setSliderValue(controls.leftCircleSizeSlider, leftCircle.size)
      setSliderValue(controls.centerCircleSizeSlider, centerCircle.size)
      setSliderValue(controls.rightCircleSizeSlider, rightCircle.size)
    } else {
      // Clear left/right icons when switching to non-player-controls preset
      renderer.setIconLeft(null).catch(console.error)
      renderer.setIconRight(null).catch(console.error)
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
    controls.circlePresetAddButton.addEventListener('click', () => {
      const currentPreset = this.options.getCurrentPreset()
      if (currentPreset !== 'circle-lens' && currentPreset !== 'rectangle' && currentPreset !== 'basic-shape') return

      if (currentPreset === 'basic-shape') {
        // In basic-shape mode, use the selected shape type
        const shapeType = controls.basicShapeTypeSelect.value as 'circle' | 'rectangle'
        const index = renderer.addGlassInstance(shapeType)
        if (shapeType === 'circle') {
          const circleInstance = renderer.getCirclePresetCircle(index)
          if (circleInstance) {
            this.setCircleSize(circleInstance.size)
          }
        }
        this.syncSlidersFromActiveInstance()
      } else {
        const index = renderer.addCirclePresetCircle()
        if (currentPreset === 'circle-lens') {
          this.setCircleSize(renderer.getCirclePresetCircle(index).size)
        }
      }
    })
    controls.basicShapeTypeSelect.addEventListener('change', () => {
      // Shape type selector - updates which type will be added next
      // No immediate action needed, the value is read when Add is clicked
    })
    controls.circlePresetStrategySelect.addEventListener('change', () => {
      const strategy = controls.circlePresetStrategySelect.value as CirclePresetStrategy
      renderer.setCirclePresetStrategy(strategy === 'merge' ? 1 : 0)
    })
    controls.panelToggleButton.addEventListener('click', () => {
      this.togglePanelDrawer()
    })
    controls.panelBackdrop.addEventListener('click', () => {
      this.setPanelDrawerOpen(false)
    })
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.setPanelDrawerOpen(false)
      }
    })

    controls.surfaceButtons.forEach((button) => {
      button.addEventListener('click', () => {
        controls.surfaceButtons.forEach((item) => item.classList.remove('active'))
        button.classList.add('active')
        const surfaceType = button.getAttribute('data-surface') as SurfaceType
        setCurrentSurfaceType(surfaceType)
        const surfaceValue = surfaceTypeMap[surfaceType]
        renderer.glassParams.surfaceType = surfaceValue
        this.updateInstanceProperty(inst => inst.surfaceType = surfaceValue)
        updateDisplacementMap()
      })
    })

    controls.bezelSlider.addEventListener('input', () => {
      const value = parseInt(controls.bezelSlider.value)
      renderer.glassParams.bezelWidth = value
      this.updateInstanceProperty(inst => inst.bezelWidth = value)
      updateDisplacementMap()
    })
    controls.thicknessSlider.addEventListener('input', () => {
      const value = parseInt(controls.thicknessSlider.value)
      renderer.glassParams.glassThickness = value
      this.updateInstanceProperty(inst => inst.glassThickness = value)
      updateDisplacementMap()
    })
    controls.refractiveIndexSlider.addEventListener('input', () => {
      const value = parseFloat(controls.refractiveIndexSlider.value)
      renderer.glassParams.refractiveIndex = value
      this.updateInstanceProperty(inst => inst.refractiveIndex = value)
      updateDisplacementMap()
    })
    controls.scaleSlider.addEventListener('input', () => {
      const value = parseFloat(controls.scaleSlider.value)
      userParams.scaleRatio = value
      this.updateInstanceProperty(inst => inst.scaleRatio = value)
      updateDisplacementMap()
    })
    controls.magnifyingScaleSlider.addEventListener('input', () => {
      const value = parseFloat(controls.magnifyingScaleSlider.value)
      userParams.magnifyingScale = value
      this.updateInstanceProperty(inst => inst.magnifyingScale = value)
    })
    controls.circleSizeSlider.addEventListener('input', () => {
      this.setCircleSize(parseFloat(controls.circleSizeSlider.value))
    })
    controls.leftCircleSizeSlider.addEventListener('input', () => {
      renderer.getCircle(0).size = parseFloat(controls.leftCircleSizeSlider.value)
    })
    controls.centerCircleSizeSlider.addEventListener('input', () => {
      renderer.getCircle(1).size = parseFloat(controls.centerCircleSizeSlider.value)
    })
    controls.rightCircleSizeSlider.addEventListener('input', () => {
      renderer.getCircle(2).size = parseFloat(controls.rightCircleSizeSlider.value)
    })
    controls.leftIconTypeSelect.addEventListener('change', () => {
      const icon = controls.leftIconTypeSelect.value
      renderer.getCircle(0).setIcon(icon === 'none' ? null : `${import.meta.env.BASE_URL}assets/icons/${icon}.svg`).catch(console.error)
    })
    controls.centerIconTypeSelect.addEventListener('change', () => {
      const icon = controls.centerIconTypeSelect.value
      if (icon === 'none') {
        renderer.glassParams.iconType = 0
        renderer.setIcon(null).catch(console.error)
      } else {
        renderer.glassParams.iconType = 1
        renderer.setIcon(`${import.meta.env.BASE_URL}assets/icons/${icon}.svg`).catch(console.error)
      }
    })
    controls.rightIconTypeSelect.addEventListener('change', () => {
      const icon = controls.rightIconTypeSelect.value
      renderer.getCircle(2).setIcon(icon === 'none' ? null : `${import.meta.env.BASE_URL}assets/icons/${icon}.svg`).catch(console.error)
    })
    controls.rectWidthSlider.addEventListener('input', () => {
      this.setRectWidth(parseFloat(controls.rectWidthSlider.value))
    })
    controls.rectHeightSlider.addEventListener('input', () => {
      this.setRectHeight(parseFloat(controls.rectHeightSlider.value))
    })
    controls.rectRadiusSlider.addEventListener('input', () => {
      renderer.glassParams.rectRadiusPercent = parseFloat(controls.rectRadiusSlider.value)
      this.updateRectRadius()
    })
    controls.splitMenuPillWidthSlider.addEventListener('input', () => {
      renderer.glassParams.splitMenuPillWidth = parseFloat(controls.splitMenuPillWidthSlider.value)
    })
    controls.splitMenuPillHeightSlider.addEventListener('input', () => {
      renderer.glassParams.splitMenuPillHeight = parseFloat(controls.splitMenuPillHeightSlider.value)
    })
    controls.splitMenuPillRadiusSlider.addEventListener('input', () => {
      renderer.glassParams.splitMenuPillRadius = parseFloat(controls.splitMenuPillRadiusSlider.value)
    })
    controls.iconTypeSelect.addEventListener('change', () => {
      const icon = controls.iconTypeSelect.value
      if (icon === 'none') {
        renderer.glassParams.iconType = 0
        renderer.setIcon(null).catch(console.error)
        renderer.setCirclePresetIcon(null).catch(console.error)
        this.updateCircleInstanceProperty(inst => inst.iconType = 0)
      } else {
        renderer.glassParams.iconType = 1
        const iconUrl = `${import.meta.env.BASE_URL}assets/icons/${icon}.svg`
        renderer.setIcon(iconUrl).catch(console.error)
        renderer.setCirclePresetIcon(iconUrl).catch(console.error)
        this.updateCircleInstanceProperty(inst => inst.iconType = 1)
      }
      this.updateIconControls()
    })
    controls.iconOpacitySlider.addEventListener('input', () => {
      const value = parseFloat(controls.iconOpacitySlider.value)
      renderer.glassParams.iconOpacity = value
      this.updateCircleInstanceProperty(inst => inst.iconOpacity = value)
    })
    controls.iconScaleSlider.addEventListener('input', () => {
      const value = parseFloat(controls.iconScaleSlider.value)
      renderer.glassParams.iconScale = value
      this.updateCircleInstanceProperty(inst => inst.iconScale = value)
    })
    controls.iconColorInput.addEventListener('input', () => {
      const hex = controls.iconColorInput.value
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      renderer.glassParams.iconColorR = r
      renderer.glassParams.iconColorG = g
      renderer.glassParams.iconColorB = b
      this.updateCircleInstanceProperty(inst => {
        inst.iconColorR = r
        inst.iconColorG = g
        inst.iconColorB = b
      })
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
      renderer.setBackground(bgType).catch(console.error)
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
      const value = parseFloat(controls.specularOpacitySlider.value)
      userParams.specularOpacity = value
      this.updateInstanceProperty(inst => inst.specularOpacity = value)
    })
    controls.specularAngleSlider.addEventListener('input', () => {
      const value = parseFloat(controls.specularAngleSlider.value) * Math.PI / 180
      renderer.glassParams.specularAngle = value
      this.updateInstanceProperty(inst => inst.specularAngle = value)
    })
    controls.specularSaturationSlider.addEventListener('input', () => {
      const value = parseFloat(controls.specularSaturationSlider.value)
      renderer.glassParams.specularSaturation = value
      this.updateInstanceProperty(inst => inst.specularSaturation = value)
    })
    controls.specularTypeSelect.addEventListener('change', () => {
      const value = parseFloat(controls.specularTypeSelect.value)
      renderer.glassParams.specularType = value
      this.updateInstanceProperty(inst => inst.specularType = value)
      this.updateSpecularControls()
    })

    controls.blurTypeSelect.addEventListener('change', () => {
      const value = parseFloat(controls.blurTypeSelect.value)
      renderer.glassParams.blurType = value
      this.updateInstanceProperty(inst => inst.blurType = value)
    })
    controls.blurAmountSlider.addEventListener('input', () => {
      const value = parseFloat(controls.blurAmountSlider.value)
      renderer.glassParams.blurAmount = value
      this.updateInstanceProperty(inst => inst.blurAmount = value)
    })
    controls.progressiveBlurSlider.addEventListener('input', () => {
      const value = parseFloat(controls.progressiveBlurSlider.value)
      renderer.glassParams.progressiveBlur = value
      this.updateInstanceProperty(inst => inst.progressiveBlur = value)
    })
    controls.progressiveBlurTypeSelect.addEventListener('change', () => {
      const value = parseFloat(controls.progressiveBlurTypeSelect.value)
      renderer.glassParams.progressiveBlurType = value
      this.updateInstanceProperty(inst => inst.progressiveBlurType = value)
    })
    controls.glassThemeSelect.addEventListener('change', () => this.updateGlassTheme())
    controls.glassBgColorInput.addEventListener('input', () => {
      const hex = controls.glassBgColorInput.value
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      renderer.glassParams.glassTintR = r
      renderer.glassParams.glassTintG = g
      renderer.glassParams.glassTintB = b
      this.updateInstanceProperty(inst => {
        inst.glassTintR = r
        inst.glassTintG = g
        inst.glassTintB = b
      })
    })
    controls.glassBgOpacitySlider.addEventListener('input', () => {
      const value = parseFloat(controls.glassBgOpacitySlider.value)
      userParams.glassBgOpacity = value
      this.updateInstanceProperty(inst => inst.glassBgOpacity = value)
    })
    controls.pressedGlassBgOpacitySlider.addEventListener('input', () => {
      const value = parseFloat(controls.pressedGlassBgOpacitySlider.value)
      userParams.pressedGlassBgOpacity = value
      this.updateInstanceProperty(inst => inst.pressedGlassBgOpacity = value)
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
      const value = parseFloat(controls.shadowOpacitySlider.value)
      userParams.shadowOpacity = value
      this.updateInstanceProperty(inst => inst.shadowOpacity = value)
    })
    controls.shadowBlurSlider.addEventListener('input', () => {
      const value = parseFloat(controls.shadowBlurSlider.value)
      userParams.shadowBlur = value
      this.updateInstanceProperty(inst => inst.shadowBlur = value)
    })
    controls.shadowOffsetXSlider.addEventListener('input', () => {
      const value = parseFloat(controls.shadowOffsetXSlider.value)
      userParams.shadowOffsetX = value
      this.updateInstanceProperty(inst => inst.shadowOffsetX = value)
    })
    controls.shadowOffsetYSlider.addEventListener('input', () => {
      const value = parseFloat(controls.shadowOffsetYSlider.value)
      userParams.shadowOffsetY = value
      this.updateInstanceProperty(inst => inst.shadowOffsetY = value)
    })

    controls.chromaticAberrationCheckbox.addEventListener('change', () => {
      const value = controls.chromaticAberrationCheckbox.checked
      renderer.glassParams.chromaticAberration = value
      this.updateInstanceProperty(inst => inst.chromaticAberration = value)
      this.updateChromaticControls()
    })
    controls.chromaticStrengthSlider.addEventListener('input', () => {
      const value = parseFloat(controls.chromaticStrengthSlider.value)
      renderer.glassParams.chromaticStrength = value
      this.updateInstanceProperty(inst => inst.chromaticStrength = value)
    })
    controls.chromaticBaseSlider.addEventListener('input', () => {
      const value = parseFloat(controls.chromaticBaseSlider.value)
      renderer.glassParams.chromaticBase = value
      this.updateInstanceProperty(inst => inst.chromaticBase = value)
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
    const preset = getCurrentPreset()
    const isCirclePreset = preset === 'circle-lens'
    const isRectanglePreset = preset === 'rectangle'
    const isBasicShape = preset === 'basic-shape'
    const isInstancePreset = isCirclePreset || isRectanglePreset || isBasicShape
    const isTrackPreset = preset === 'switch' || preset === 'slider'
    const isPlayerControls = preset === 'player-controls'
    const isSplitMenu = preset === 'split-menu'

    // For basic-shape mode, check the active instance type
    let showCircleControls = false
    let showRectControls = false
    if (isBasicShape) {
      const activeCircle = renderer.getActiveCircleInstance()
      const activeRect = renderer.getActiveRectangleInstance()
      showCircleControls = !!activeCircle
      showRectControls = !!activeRect
    } else {
      const isRectangle = renderer.glassParams.shapeType === 1
      showCircleControls = !isRectangle && !isPlayerControls && !isSplitMenu
      showRectControls = isRectangle
    }

    controls.circleOnlyControls.forEach((control) => control.classList.toggle('hidden', !showCircleControls))
    controls.circlePresetOnlyControls.forEach((control) => control.classList.toggle('hidden', !isInstancePreset))
    controls.basicShapeOnlyControls.forEach((control) => control.classList.toggle('hidden', !isBasicShape))
    controls.rectOnlyControls.forEach((control) => control.classList.toggle('hidden', !showRectControls))
    controls.switchOnlyControls.forEach((control) => control.classList.toggle('hidden', !isTrackPreset))
    controls.playerControlsOnlyControls.forEach((control) => control.classList.toggle('hidden', !isPlayerControls))
    controls.splitMenuOnlyControls.forEach((control) => control.classList.toggle('hidden', !isSplitMenu))
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
    const usesGridControls = bgType === 'grid'
    controls.gridOnlyControls.forEach((control) => control.classList.toggle('hidden', !usesGridControls))
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
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    renderer.glassParams.glassTintR = r
    renderer.glassParams.glassTintG = g
    renderer.glassParams.glassTintB = b
    this.updateInstanceProperty(inst => {
      inst.glassTintR = r
      inst.glassTintG = g
      inst.glassTintB = b
    })
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
