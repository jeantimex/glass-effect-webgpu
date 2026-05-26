import './style.css'
import { BackgroundType, WebGPURenderer } from './webgpu/renderer'
import {
  SurfaceType,
  calculateDisplacementMap1D,
  renderDisplacementMap2D,
} from './displacement-map'


const surfaceTypeMap: Record<SurfaceType, number> = {
  'convex-circle': 0,
  'convex-squircle': 1,
  'concave': 2,
  'lip': 3,
}

type PresetType = 'circle-lens' | 'rectangle' | 'switch'
type GlassTheme = 'system' | 'light' | 'dark'

interface GlassPreset {
  shapeType: number
  surfaceType: SurfaceType
  bezelWidth: number
  glassThickness: number
  refractiveIndex: number
  magnifyingScale: number
  circleSize: number
  rectWidth: number
  rectHeight: number
  rectRadiusPercent: number
  switchTrackWidth: number
  switchTrackHeight: number
  switchTrackOffOpacity: number
  switchTrackOnOpacity: number
  scaleRatio: number
  blurAmount: number
  blurType: number
  progressiveBlur: number
  progressiveBlurType: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number
  specularType: number
  specularOpacity: number
  specularAngle: number
  specularSaturation: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  liquidPressScale: number
  liquidPressRefraction: number
  liquidClickSquash: number
  liquidDragSquash: number
  liquidReleaseSquash: number
  liquidSpeed: number
}

const presets: Record<PresetType, GlassPreset> = {
  'circle-lens': {
    shapeType: 0,
    surfaceType: 'convex-circle',
    bezelWidth: 60,
    glassThickness: 50,
    refractiveIndex: 1.5,
    magnifyingScale: 0,
    circleSize: 1,
    rectWidth: 420,
    rectHeight: 96,
    rectRadiusPercent: 100,
    switchTrackWidth: 184,
    switchTrackHeight: 67,
    switchTrackOffOpacity: 0.34,
    switchTrackOnOpacity: 0.86,
    scaleRatio: 1,
    blurAmount: 0,
    blurType: 1,
    progressiveBlur: 0,
    progressiveBlurType: 0,
    glassBgOpacity: 0,
    pressedGlassBgOpacity: 0,
    specularType: 0,
    specularOpacity: 0.4,
    specularAngle: 60,
    specularSaturation: 4,
    shadowOpacity: 0.1,
    shadowBlur: 30,
    shadowOffsetX: 0,
    shadowOffsetY: 15,
    liquidPressScale: 1.16,
    liquidPressRefraction: 1.28,
    liquidClickSquash: 1,
    liquidDragSquash: 1,
    liquidReleaseSquash: 1,
    liquidSpeed: 1,
  },
  rectangle: {
    shapeType: 1,
    surfaceType: 'convex-squircle',
    bezelWidth: 60,
    glassThickness: 50,
    refractiveIndex: 1.5,
    magnifyingScale: 0,
    circleSize: 1,
    rectWidth: 420,
    rectHeight: 96,
    rectRadiusPercent: 100,
    switchTrackWidth: 184,
    switchTrackHeight: 67,
    switchTrackOffOpacity: 0.34,
    switchTrackOnOpacity: 0.86,
    scaleRatio: 1,
    blurAmount: 0,
    blurType: 1,
    progressiveBlur: 0,
    progressiveBlurType: 0,
    glassBgOpacity: 0.08,
    pressedGlassBgOpacity: 0,
    specularType: 0,
    specularOpacity: 0.4,
    specularAngle: 60,
    specularSaturation: 4,
    shadowOpacity: 0.12,
    shadowBlur: 26,
    shadowOffsetX: 0,
    shadowOffsetY: 12,
    liquidPressScale: 1.16,
    liquidPressRefraction: 1.28,
    liquidClickSquash: 1,
    liquidDragSquash: 1,
    liquidReleaseSquash: 1,
    liquidSpeed: 1,
  },
  switch: {
    shapeType: 1,
    surfaceType: 'lip',
    bezelWidth: 45,
    glassThickness: 47,
    refractiveIndex: 1.5,
    magnifyingScale: 0,
    circleSize: 0.65,
    rectWidth: 146,
    rectHeight: 92,
    rectRadiusPercent: 100,
    switchTrackWidth: 184,
    switchTrackHeight: 67,
    switchTrackOffOpacity: 0.34,
    switchTrackOnOpacity: 0.86,
    scaleRatio: 0.4,
    blurAmount: 0.2,
    blurType: 0,
    progressiveBlur: 0,
    progressiveBlurType: 0,
    glassBgOpacity: 0.1,
    pressedGlassBgOpacity: 0,
    specularType: 0,
    specularOpacity: 0.5,
    specularAngle: 60,
    specularSaturation: 6,
    shadowOpacity: 0.1,
    shadowBlur: 22,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    liquidPressScale: 1.38,
    liquidPressRefraction: 2.25,
    liquidClickSquash: 0.85,
    liquidDragSquash: 1.1,
    liquidReleaseSquash: 0.9,
    liquidSpeed: 1.2,
  },
}

async function main() {
  const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement
  const displacementCanvas = document.getElementById('displacementMap') as HTMLCanvasElement
  const circleSizeSlider = document.getElementById('circleSize') as HTMLInputElement
  const rectWidthSlider = document.getElementById('rectWidth') as HTMLInputElement
  const rectHeightSlider = document.getElementById('rectHeight') as HTMLInputElement
  const rectRadiusSlider = document.getElementById('rectRadius') as HTMLInputElement
  const switchTrackWidthSlider = document.getElementById('switchTrackWidth') as HTMLInputElement
  const switchTrackHeightSlider = document.getElementById('switchTrackHeight') as HTMLInputElement
  const switchTrackOffOpacitySlider = document.getElementById('switchTrackOffOpacity') as HTMLInputElement
  const switchTrackOnOpacitySlider = document.getElementById('switchTrackOnOpacity') as HTMLInputElement

  if (!mainCanvas || !displacementCanvas) {
    throw new Error('Canvas elements not found')
  }

  // Initialize WebGPU renderer
  const renderer = new WebGPURenderer(mainCanvas)
  await renderer.init()

  // Store user-selected values from UI (baseline values)
  const userParams = {
    circleSize: renderer.glassParams.circleSize, // Baseline 1.0
    scaleRatio: renderer.glassParams.scaleRatio, // Baseline 1.0
    magnifyingScale: renderer.glassParams.magnifyingScale,
    shadowOpacity: renderer.glassParams.shadowOpacity,
    shadowBlur: renderer.glassParams.shadowBlur,
    shadowOffsetX: renderer.glassParams.shadowOffsetX,
    shadowOffsetY: renderer.glassParams.shadowOffsetY,
    specularOpacity: renderer.glassParams.specularOpacity,
    glassBgOpacity: renderer.glassParams.glassBgOpacity,
    pressedGlassBgOpacity: 0,
    liquidEnabled: true,
    liquidPressScale: 1.16,
    liquidPressRefraction: 1.28,
    liquidSpeed: 1,
    liquidClickSquash: 1,
    liquidDragSquash: 1,
    liquidReleaseSquash: 1,
  }

  // Local state for surface type (string version for displacement map)
  let currentSurfaceType: SurfaceType = 'convex-circle'

  // Update displacement map visualization
  function updateDisplacementMap() {
    const displacements1D = calculateDisplacementMap1D(
      renderer.glassParams.glassThickness,
      renderer.glassParams.bezelWidth,
      currentSurfaceType,
      renderer.glassParams.refractiveIndex,
      128
    )
    renderDisplacementMap2D(
      displacementCanvas,
      displacements1D,
      renderer.glassParams.bezelWidth,
      userParams.scaleRatio
    )
  }

  // Initial render
  updateDisplacementMap()

  document.querySelectorAll<HTMLButtonElement>('.section-header').forEach((header) => {
    header.addEventListener('click', () => {
      const section = header.closest<HTMLElement>('.panel-section')
      if (!section) return

      const collapsed = section.classList.toggle('collapsed')
      header.setAttribute('aria-expanded', String(!collapsed))

      if (!collapsed && section.classList.contains('displacement-section')) {
        updateDisplacementMap()
      }
    })
  })

  let draggingGlass = false
  let glassDragOffset = { x: 0, y: 0 }
  let lastPointerPos = { x: 0, y: 0 }
  let pointerStartPos = { x: 0, y: 0 }
  let lastPointerTime = 0
  let currentVelocity = { x: 0, y: 0 }
  let currentPreset: PresetType = 'circle-lens'

  function createSpring(value: number, stiffness: number, damping: number) {
    return { value, velocity: 0, target: value, stiffness, damping }
  }

  // Animate cheap parameters while the shader keeps refraction math resolution-independent.
  const springs = {
    scale: createSpring(renderer.glassParams.circleSize, 360, 18),
    refraction: createSpring(renderer.glassParams.scaleRatio, 420, 18),
    magnification: createSpring(renderer.glassParams.magnifyingScale, 360, 22),
    deformationX: createSpring(1.0, 300, 15),
    deformationY: createSpring(1.0, 300, 15),
    shadowOpacity: createSpring(renderer.glassParams.shadowOpacity, 360, 24),
    shadowBlur: createSpring(renderer.glassParams.shadowBlur, 360, 24),
    shadowOffsetY: createSpring(renderer.glassParams.shadowOffsetY, 360, 24),
    specularOpacity: createSpring(renderer.glassParams.specularOpacity, 420, 20),
    glassBgOpacity: createSpring(renderer.glassParams.glassBgOpacity, 800, 50),
    liquid: createSpring(0, 300, 13),
  }
  let lastFrameTime = performance.now()

  function updateCanvasCursor(event: PointerEvent) {
    if (draggingGlass) {
      mainCanvas.style.cursor = 'grabbing'
      return
    }

    mainCanvas.style.cursor = renderer.isPointInsideGlass(event.clientX, event.clientY)
      ? 'grab'
      : 'default'
  }

  function setCircleSize(size: number) {
    const min = circleSizeSlider ? parseFloat(circleSizeSlider.min) : 0.3
    const max = circleSizeSlider ? parseFloat(circleSizeSlider.max) : 1.3
    const clampedSize = Math.min(Math.max(size, min), max)

    userParams.circleSize = clampedSize
    if (circleSizeSlider) {
      circleSizeSlider.value = clampedSize.toFixed(2)
    }
  }

  function setRectWidth(width: number) {
    const min = rectWidthSlider ? parseFloat(rectWidthSlider.min) : 48
    const max = rectWidthSlider ? parseFloat(rectWidthSlider.max) : 760
    const clampedWidth = Math.min(Math.max(width, min), max)

    renderer.glassParams.rectWidth = clampedWidth
    if (rectWidthSlider) {
      rectWidthSlider.value = String(clampedWidth)
    }
  }

  function setRectHeight(height: number) {
    const min = rectHeightSlider ? parseFloat(rectHeightSlider.min) : 48
    const max = rectHeightSlider ? parseFloat(rectHeightSlider.max) : 760
    const clampedHeight = Math.min(Math.max(height, min), max)

    renderer.glassParams.rectHeight = clampedHeight
    if (rectHeightSlider) {
      rectHeightSlider.value = String(clampedHeight)
    }
  }

  function setRectRadiusPercent(radiusPercent: number) {
    const min = rectRadiusSlider ? parseFloat(rectRadiusSlider.min) : 0
    const max = rectRadiusSlider ? parseFloat(rectRadiusSlider.max) : 100
    const clampedRadius = Math.min(Math.max(radiusPercent, min), max)

    renderer.glassParams.rectRadiusPercent = clampedRadius
    if (rectRadiusSlider) {
      rectRadiusSlider.value = String(clampedRadius)
    }
  }

  mainCanvas.addEventListener('pointerdown', (event) => {
    const isSwitch = currentPreset === 'switch'
    if (isSwitch) {
      if (!renderer.isPointInsideSwitchTrack(event.clientX, event.clientY)) return
    } else if (!renderer.isPointInsideGlass(event.clientX, event.clientY)) {
      return
    }

    draggingGlass = true
    glassDragOffset = renderer.getGlassDragOffset(event.clientX, event.clientY)
    lastPointerPos = { x: event.clientX, y: event.clientY }
    pointerStartPos = { x: event.clientX, y: event.clientY }
    lastPointerTime = performance.now()
    currentVelocity = { x: 0, y: 0 }

    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.72 * userParams.liquidClickSquash)
      springs.liquid.velocity += 2.6 * userParams.liquidClickSquash
    }

    mainCanvas.style.cursor = 'grabbing'

    mainCanvas.setPointerCapture(event.pointerId)
    event.preventDefault()
  })

  mainCanvas.addEventListener('pointermove', (event) => {
    if (!draggingGlass) {
      updateCanvasCursor(event)
      return
    }

    const now = performance.now()
    const dt = Math.max((now - lastPointerTime) / 1000, 1 / 120)
    currentVelocity.x = (event.clientX - lastPointerPos.x) / dt
    currentVelocity.y = (event.clientY - lastPointerPos.y) / dt
    lastPointerPos = { x: event.clientX, y: event.clientY }
    lastPointerTime = now

    if (currentPreset === 'switch') {
      renderer.setSwitchProgressFromClientX(event.clientX)
    } else {
      renderer.setGlassCenterFromClientPoint(event.clientX, event.clientY, glassDragOffset)
    }
    event.preventDefault()
  })

  mainCanvas.addEventListener('pointerup', (event) => {
    if (!draggingGlass) {
      updateCanvasCursor(event)
      return
    }

    draggingGlass = false
    currentVelocity = { x: 0, y: 0 }
    const dragDistance = Math.hypot(event.clientX - pointerStartPos.x, event.clientY - pointerStartPos.y)
    if (currentPreset === 'switch' && dragDistance < 4) {
      renderer.setSwitchProgress(renderer.getSwitchProgress() > 0.5 ? 0 : 1)
    }
    if (userParams.liquidEnabled) {
      springs.liquid.value = Math.max(springs.liquid.value, 0.58 * userParams.liquidReleaseSquash)
      springs.liquid.velocity -= 3.0 * userParams.liquidReleaseSquash
    }

    if (mainCanvas.hasPointerCapture(event.pointerId)) {
      mainCanvas.releasePointerCapture(event.pointerId)
    }
    updateCanvasCursor(event)
  })

  mainCanvas.addEventListener('pointercancel', (event) => {
    if (!draggingGlass) return

    draggingGlass = false
    if (mainCanvas.hasPointerCapture(event.pointerId)) {
      mainCanvas.releasePointerCapture(event.pointerId)
    }
    updateCanvasCursor(event)
  })

  mainCanvas.addEventListener('pointerleave', () => {
    if (!draggingGlass) {
      mainCanvas.style.cursor = 'default'
    }
  })

  mainCanvas.addEventListener('wheel', (event) => {
    if (!renderer.isPointInsideGlass(event.clientX, event.clientY)) return

    const direction = event.deltaY > 0 ? -1 : 1
    if (renderer.glassParams.shapeType === 1) {
      const targetScale = direction > 0 ? 1.06 : 1 / 1.06
      const minWidth = rectWidthSlider ? parseFloat(rectWidthSlider.min) : 48
      const maxWidth = rectWidthSlider ? parseFloat(rectWidthSlider.max) : 760
      const minHeight = rectHeightSlider ? parseFloat(rectHeightSlider.min) : 48
      const maxHeight = rectHeightSlider ? parseFloat(rectHeightSlider.max) : 760
      const currentWidth = renderer.glassParams.rectWidth
      const currentHeight = renderer.glassParams.rectHeight
      const scale = direction > 0
        ? Math.min(targetScale, maxWidth / currentWidth, maxHeight / currentHeight)
        : Math.max(targetScale, minWidth / currentWidth, minHeight / currentHeight)

      setRectWidth(currentWidth * scale)
      setRectHeight(currentHeight * scale)
    } else {
      setCircleSize(userParams.circleSize + direction * 0.04)
    }
    event.preventDefault()
  }, { passive: false })

  // Surface type buttons
  const surfaceButtons = document.querySelectorAll('.surface-btn')
  surfaceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      surfaceButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      currentSurfaceType = btn.getAttribute('data-surface') as SurfaceType
      renderer.glassParams.surfaceType = surfaceTypeMap[currentSurfaceType]
      updateDisplacementMap()
    })
  })

  // Sliders
  const presetSelect = document.getElementById('presetType') as HTMLSelectElement
  const bezelSlider = document.getElementById('bezelWidth') as HTMLInputElement
  const thicknessSlider = document.getElementById('glassThickness') as HTMLInputElement
  const scaleSlider = document.getElementById('scaleRatio') as HTMLInputElement
  const gridCellSizeSlider = document.getElementById('gridCellSize') as HTMLInputElement
  const refractiveIndexSlider = document.getElementById('refractiveIndex') as HTMLInputElement
  const magnifyingScaleSlider = document.getElementById('magnifyingScale') as HTMLInputElement
  const specularOpacitySlider = document.getElementById('specularOpacity') as HTMLInputElement
  const specularAngleSlider = document.getElementById('specularAngle') as HTMLInputElement
  const specularSaturationSlider = document.getElementById('specularSaturation') as HTMLInputElement
  const specularTypeSelect = document.getElementById('specularType') as HTMLSelectElement
  const blurTypeSelect = document.getElementById('blurType') as HTMLSelectElement
  const blurAmountSlider = document.getElementById('blurAmount') as HTMLInputElement
  const progressiveBlurSlider = document.getElementById('progressiveBlur') as HTMLInputElement
  const progressiveBlurTypeSelect = document.getElementById('progressiveBlurType') as HTMLSelectElement
  const glassThemeSelect = document.getElementById('glassTheme') as HTMLSelectElement
  const glassBgOpacitySlider = document.getElementById('glassBgOpacity') as HTMLInputElement
  const pressedGlassBgOpacitySlider = document.getElementById('pressedGlassBgOpacity') as HTMLInputElement
  const liquidEnabledCheckbox = document.getElementById('liquidEnabled') as HTMLInputElement
  const liquidPressScaleSlider = document.getElementById('liquidPressScale') as HTMLInputElement
  const liquidPressRefractionSlider = document.getElementById('liquidPressRefraction') as HTMLInputElement
  const liquidSpeedSlider = document.getElementById('liquidSpeed') as HTMLInputElement
  const liquidClickSquashSlider = document.getElementById('liquidClickSquash') as HTMLInputElement
  const liquidDragSquashSlider = document.getElementById('liquidDragSquash') as HTMLInputElement
  const liquidReleaseSquashSlider = document.getElementById('liquidReleaseSquash') as HTMLInputElement
  const shadowOpacitySlider = document.getElementById('shadowOpacity') as HTMLInputElement
  const shadowBlurSlider = document.getElementById('shadowBlur') as HTMLInputElement
  const shadowOffsetXSlider = document.getElementById('shadowOffsetX') as HTMLInputElement
  const shadowOffsetYSlider = document.getElementById('shadowOffsetY') as HTMLInputElement
  const circleOnlyControls = document.querySelectorAll<HTMLElement>('.circle-only-control')
  const rectOnlyControls = document.querySelectorAll<HTMLElement>('.rect-only-control')
  const switchOnlyControls = document.querySelectorAll<HTMLElement>('.switch-only-control')

  function setSliderValue(slider: HTMLInputElement | null, value: number) {
    if (slider) slider.value = String(value)
  }

  function updateShapeControls() {
    const isRectangle = renderer.glassParams.shapeType === 1
    const isSwitch = currentPreset === 'switch'
    circleOnlyControls.forEach((control) => {
      control.classList.toggle('hidden', isRectangle)
    })
    rectOnlyControls.forEach((control) => {
      control.classList.toggle('hidden', !isRectangle)
    })
    switchOnlyControls.forEach((control) => {
      control.classList.toggle('hidden', !isSwitch)
    })
  }

  function resolveGlassTheme(): Exclude<GlassTheme, 'system'> {
    const selectedTheme = (glassThemeSelect?.value ?? 'system') as GlassTheme
    if (selectedTheme === 'light' || selectedTheme === 'dark') {
      return selectedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function updateGlassTheme() {
    const resolvedTheme = resolveGlassTheme()
    const darkTint = 0x22 / 255
    renderer.glassParams.glassTintR = resolvedTheme === 'dark' ? darkTint : 1
    renderer.glassParams.glassTintG = resolvedTheme === 'dark' ? darkTint : 1
    renderer.glassParams.glassTintB = resolvedTheme === 'dark' ? darkTint : 1
  }

  function updateSpecularControls() {
    const isLayeredSpecular = renderer.glassParams.specularType === 1
    const saturationRow = specularSaturationSlider?.closest<HTMLElement>('.control-row')
    saturationRow?.classList.toggle('hidden', isLayeredSpecular)
  }

  function applyPreset(type: PresetType) {
    const preset = presets[type]
    currentPreset = type
    renderer.glassParams.shapeType = preset.shapeType
    renderer.setSwitchMode(type === 'switch')
    if (type === 'switch') {
      renderer.setSwitchProgress(1)
    }
    currentSurfaceType = preset.surfaceType
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
    renderer.glassParams.scaleRatio = preset.scaleRatio
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
    springs.scale.value = preset.circleSize
    springs.scale.target = preset.circleSize
    springs.scale.velocity = 0
    springs.refraction.value = preset.scaleRatio
    springs.refraction.target = preset.scaleRatio
    springs.refraction.velocity = 0
    springs.magnification.value = preset.magnifyingScale
    springs.magnification.target = preset.magnifyingScale
    springs.magnification.velocity = 0
    springs.shadowOpacity.value = preset.shadowOpacity
    springs.shadowOpacity.target = preset.shadowOpacity
    springs.shadowOpacity.velocity = 0
    springs.shadowBlur.value = preset.shadowBlur
    springs.shadowBlur.target = preset.shadowBlur
    springs.shadowBlur.velocity = 0
    springs.shadowOffsetY.value = preset.shadowOffsetY
    springs.shadowOffsetY.target = preset.shadowOffsetY
    springs.shadowOffsetY.velocity = 0
    springs.specularOpacity.value = preset.specularOpacity
    springs.specularOpacity.target = preset.specularOpacity
    springs.specularOpacity.velocity = 0
    springs.glassBgOpacity.value = preset.glassBgOpacity
    springs.glassBgOpacity.target = preset.glassBgOpacity
    springs.glassBgOpacity.velocity = 0
    springs.liquid.value = 0
    springs.liquid.target = 0
    springs.liquid.velocity = 0

    surfaceButtons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-surface') === preset.surfaceType)
    })
    setSliderValue(bezelSlider, preset.bezelWidth)
    setSliderValue(thicknessSlider, preset.glassThickness)
    setSliderValue(refractiveIndexSlider, preset.refractiveIndex)
    setSliderValue(magnifyingScaleSlider, preset.magnifyingScale)
    setSliderValue(circleSizeSlider, preset.circleSize)
    setSliderValue(rectWidthSlider, preset.rectWidth)
    setSliderValue(rectHeightSlider, preset.rectHeight)
    setSliderValue(rectRadiusSlider, preset.rectRadiusPercent)
    setSliderValue(switchTrackWidthSlider, preset.switchTrackWidth)
    setSliderValue(switchTrackHeightSlider, preset.switchTrackHeight)
    setSliderValue(switchTrackOffOpacitySlider, preset.switchTrackOffOpacity)
    setSliderValue(switchTrackOnOpacitySlider, preset.switchTrackOnOpacity)
    setSliderValue(scaleSlider, preset.scaleRatio)
    if (specularTypeSelect) specularTypeSelect.value = String(preset.specularType)
    if (blurTypeSelect) blurTypeSelect.value = String(preset.blurType)
    setSliderValue(blurAmountSlider, preset.blurAmount)
    setSliderValue(progressiveBlurSlider, preset.progressiveBlur)
    if (progressiveBlurTypeSelect) progressiveBlurTypeSelect.value = String(preset.progressiveBlurType)
    setSliderValue(glassBgOpacitySlider, preset.glassBgOpacity)
    setSliderValue(pressedGlassBgOpacitySlider, preset.pressedGlassBgOpacity)
    setSliderValue(liquidPressScaleSlider, preset.liquidPressScale)
    setSliderValue(liquidPressRefractionSlider, preset.liquidPressRefraction)
    setSliderValue(liquidClickSquashSlider, preset.liquidClickSquash)
    setSliderValue(liquidDragSquashSlider, preset.liquidDragSquash)
    setSliderValue(liquidReleaseSquashSlider, preset.liquidReleaseSquash)
    setSliderValue(liquidSpeedSlider, preset.liquidSpeed)
    setSliderValue(specularOpacitySlider, preset.specularOpacity)
    setSliderValue(specularAngleSlider, preset.specularAngle)
    setSliderValue(specularSaturationSlider, preset.specularSaturation)
    setSliderValue(shadowOpacitySlider, preset.shadowOpacity)
    setSliderValue(shadowBlurSlider, preset.shadowBlur)
    setSliderValue(shadowOffsetXSlider, preset.shadowOffsetX)
    setSliderValue(shadowOffsetYSlider, preset.shadowOffsetY)
    updateShapeControls()
    updateDisplacementMap()
  }

  updateShapeControls()
  updateGlassTheme()
  updateSpecularControls()

  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  colorSchemeQuery.addEventListener('change', () => {
    if ((glassThemeSelect?.value ?? 'system') === 'system') {
      updateGlassTheme()
    }
  })

  presetSelect?.addEventListener('change', () => {
    applyPreset(presetSelect.value as PresetType)
  })

  bezelSlider?.addEventListener('input', () => {
    renderer.glassParams.bezelWidth = parseInt(bezelSlider.value)
    updateDisplacementMap()
  })

  thicknessSlider?.addEventListener('input', () => {
    renderer.glassParams.glassThickness = parseInt(thicknessSlider.value)
    updateDisplacementMap()
  })

  refractiveIndexSlider?.addEventListener('input', () => {
    renderer.glassParams.refractiveIndex = parseFloat(refractiveIndexSlider.value)
    updateDisplacementMap()
  })

  magnifyingScaleSlider?.addEventListener('input', () => {
    userParams.magnifyingScale = parseFloat(magnifyingScaleSlider.value)
  })

  circleSizeSlider?.addEventListener('input', () => {
    setCircleSize(parseFloat(circleSizeSlider.value))
  })

  rectWidthSlider?.addEventListener('input', () => {
    setRectWidth(parseFloat(rectWidthSlider.value))
  })

  rectHeightSlider?.addEventListener('input', () => {
    setRectHeight(parseFloat(rectHeightSlider.value))
  })

  rectRadiusSlider?.addEventListener('input', () => {
    setRectRadiusPercent(parseFloat(rectRadiusSlider.value))
  })

  switchTrackWidthSlider?.addEventListener('input', () => {
    renderer.glassParams.switchTrackWidth = parseFloat(switchTrackWidthSlider.value)
    if (currentPreset === 'switch') {
      renderer.setSwitchProgress(renderer.getSwitchProgress())
    }
  })

  switchTrackHeightSlider?.addEventListener('input', () => {
    renderer.glassParams.switchTrackHeight = parseFloat(switchTrackHeightSlider.value)
    if (currentPreset === 'switch') {
      renderer.setSwitchProgress(renderer.getSwitchProgress())
    }
  })

  switchTrackOffOpacitySlider?.addEventListener('input', () => {
    renderer.glassParams.switchTrackOffOpacity = parseFloat(switchTrackOffOpacitySlider.value)
  })

  switchTrackOnOpacitySlider?.addEventListener('input', () => {
    renderer.glassParams.switchTrackOnOpacity = parseFloat(switchTrackOnOpacitySlider.value)
  })

  const backgroundTypeSelect = document.getElementById('backgroundType') as HTMLSelectElement
  const gridOnlyControls = document.querySelectorAll<HTMLElement>('.grid-only-control')

  function updateBackgroundControls() {
    const isGrid = backgroundTypeSelect?.value === 'grid'
    gridOnlyControls.forEach((control) => {
      control.classList.toggle('hidden', !isGrid)
    })
  }

  updateBackgroundControls()

  backgroundTypeSelect?.addEventListener('change', () => {
    renderer.setBackground(backgroundTypeSelect.value as BackgroundType).catch(console.error)
    updateBackgroundControls()
  })

  scaleSlider?.addEventListener('input', () => {
    userParams.scaleRatio = parseFloat(scaleSlider.value)
    updateDisplacementMap()
  })

  gridCellSizeSlider?.addEventListener('input', () => {
    renderer.glassParams.gridCellSize = parseFloat(gridCellSizeSlider.value)
  })

  const gridSpeedSlider = document.getElementById('gridSpeed') as HTMLInputElement
  gridSpeedSlider?.addEventListener('input', () => {
    renderer.setGridSpeed(parseFloat(gridSpeedSlider.value))
  })

  specularOpacitySlider?.addEventListener('input', () => {
    userParams.specularOpacity = parseFloat(specularOpacitySlider.value)
  })

  specularAngleSlider?.addEventListener('input', () => {
    renderer.glassParams.specularAngle = parseFloat(specularAngleSlider.value) * Math.PI / 180
  })

  specularSaturationSlider?.addEventListener('input', () => {
    renderer.glassParams.specularSaturation = parseFloat(specularSaturationSlider.value)
  })

  specularTypeSelect?.addEventListener('change', () => {
    renderer.glassParams.specularType = parseFloat(specularTypeSelect.value)
    updateSpecularControls()
  })

  blurTypeSelect?.addEventListener('change', () => {
    renderer.glassParams.blurType = parseFloat(blurTypeSelect.value)
  })

  blurAmountSlider?.addEventListener('input', () => {
    renderer.glassParams.blurAmount = parseFloat(blurAmountSlider.value)
  })

  progressiveBlurSlider?.addEventListener('input', () => {
    renderer.glassParams.progressiveBlur = parseFloat(progressiveBlurSlider.value)
  })

  progressiveBlurTypeSelect?.addEventListener('change', () => {
    renderer.glassParams.progressiveBlurType = parseFloat(progressiveBlurTypeSelect.value)
  })

  glassThemeSelect?.addEventListener('change', () => {
    updateGlassTheme()
  })

  glassBgOpacitySlider?.addEventListener('input', () => {
    userParams.glassBgOpacity = parseFloat(glassBgOpacitySlider.value)
  })

  pressedGlassBgOpacitySlider?.addEventListener('input', () => {
    userParams.pressedGlassBgOpacity = parseFloat(pressedGlassBgOpacitySlider.value)
  })

  liquidEnabledCheckbox?.addEventListener('change', () => {
    userParams.liquidEnabled = liquidEnabledCheckbox.checked
    if (!userParams.liquidEnabled) {
      springs.liquid.value = 0
      springs.liquid.target = 0
      springs.liquid.velocity = 0
      springs.deformationX.value = 1
      springs.deformationX.target = 1
      springs.deformationX.velocity = 0
      springs.deformationY.value = 1
      springs.deformationY.target = 1
      springs.deformationY.velocity = 0
    }
  })

  liquidPressScaleSlider?.addEventListener('input', () => {
    userParams.liquidPressScale = parseFloat(liquidPressScaleSlider.value)
  })

  liquidPressRefractionSlider?.addEventListener('input', () => {
    userParams.liquidPressRefraction = parseFloat(liquidPressRefractionSlider.value)
  })

  liquidSpeedSlider?.addEventListener('input', () => {
    userParams.liquidSpeed = parseFloat(liquidSpeedSlider.value)
  })

  liquidClickSquashSlider?.addEventListener('input', () => {
    userParams.liquidClickSquash = parseFloat(liquidClickSquashSlider.value)
  })

  liquidDragSquashSlider?.addEventListener('input', () => {
    userParams.liquidDragSquash = parseFloat(liquidDragSquashSlider.value)
  })

  liquidReleaseSquashSlider?.addEventListener('input', () => {
    userParams.liquidReleaseSquash = parseFloat(liquidReleaseSquashSlider.value)
  })

  const bgBrightnessSlider = document.getElementById('bgBrightness') as HTMLInputElement
  bgBrightnessSlider?.addEventListener('input', () => {
    renderer.glassParams.bgBrightness = parseFloat(bgBrightnessSlider.value)
  })

  shadowOpacitySlider?.addEventListener('input', () => {
    userParams.shadowOpacity = parseFloat(shadowOpacitySlider.value)
  })

  shadowBlurSlider?.addEventListener('input', () => {
    userParams.shadowBlur = parseFloat(shadowBlurSlider.value)
  })

  shadowOffsetXSlider?.addEventListener('input', () => {
    userParams.shadowOffsetX = parseFloat(shadowOffsetXSlider.value)
  })

  shadowOffsetYSlider?.addEventListener('input', () => {
    userParams.shadowOffsetY = parseFloat(shadowOffsetYSlider.value)
  })

  // Handle resize for displacement map canvas
  const resizeObserver = new ResizeObserver(() => {
    updateDisplacementMap()
  })
  resizeObserver.observe(displacementCanvas)

  // Render loop
  function render() {
    const now = performance.now()
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05)
    lastFrameTime = now
    const velocityDecay = Math.exp(-dt * (draggingGlass ? 5.5 : 12))
    currentVelocity.x *= velocityDecay
    currentVelocity.y *= velocityDecay
    const speed = Math.hypot(currentVelocity.x, currentVelocity.y)
    const liquidAmount = userParams.liquidEnabled ? 1 : 0
    const dragLiquid = draggingGlass
      ? Math.min(speed * 0.00018 * userParams.liquidDragSquash * liquidAmount, 0.28 * userParams.liquidDragSquash)
      : 0

    if (draggingGlass) {
      springs.scale.target = userParams.circleSize * (userParams.liquidEnabled ? userParams.liquidPressScale : 1)
      springs.refraction.target = userParams.scaleRatio * (userParams.liquidEnabled ? userParams.liquidPressRefraction + dragLiquid * 0.45 : 1)
      springs.magnification.target = userParams.magnifyingScale
      springs.shadowOpacity.target = userParams.liquidEnabled ? Math.min(userParams.shadowOpacity + 0.1, 1) : userParams.shadowOpacity
      springs.shadowBlur.target = userParams.liquidEnabled ? userParams.shadowBlur * 0.72 : userParams.shadowBlur
      springs.shadowOffsetY.target = userParams.liquidEnabled ? userParams.shadowOffsetY + 5 : userParams.shadowOffsetY
      springs.specularOpacity.target = userParams.liquidEnabled ? Math.min(userParams.specularOpacity + 0.22, 1) : userParams.specularOpacity
      springs.glassBgOpacity.target = userParams.pressedGlassBgOpacity
      springs.liquid.target = 0
    } else {
      springs.scale.target = userParams.circleSize
      springs.refraction.target = userParams.scaleRatio
      springs.magnification.target = userParams.magnifyingScale
      springs.shadowOpacity.target = userParams.shadowOpacity
      springs.shadowBlur.target = userParams.shadowBlur
      springs.shadowOffsetY.target = userParams.shadowOffsetY
      springs.specularOpacity.target = userParams.specularOpacity
      springs.glassBgOpacity.target = userParams.glassBgOpacity
      springs.liquid.target = 0
    }

    const velocityX = Math.min(Math.abs(currentVelocity.x) * 0.00016 * userParams.liquidDragSquash * liquidAmount, 0.24 * userParams.liquidDragSquash)
    const velocityY = Math.min(Math.abs(currentVelocity.y) * 0.00016 * userParams.liquidDragSquash * liquidAmount, 0.24 * userParams.liquidDragSquash)
    springs.deformationX.target = 1.0 + springs.liquid.value * 0.12 * liquidAmount + velocityX - velocityY * 0.45
    springs.deformationY.target = 1.0 - springs.liquid.value * 0.08 * liquidAmount + velocityY - velocityX * 0.45

    // Update springs
    const springSpeed = userParams.liquidEnabled ? userParams.liquidSpeed : 1
    for (const key in springs) {
      const s = springs[key as keyof typeof springs]
      let remaining = dt
      while (remaining > 0) {
        const step = Math.min(remaining, 1 / 120)
        const acceleration = (s.target - s.value) * s.stiffness * springSpeed * springSpeed - s.velocity * s.damping * springSpeed
        s.velocity += acceleration * step
        s.value += s.velocity * step
        remaining -= step
      }
    }

    // Apply spring values to renderer
    const interactionScale = springs.scale.value
    const isRectangle = renderer.glassParams.shapeType === 1
    renderer.glassParams.circleSize = isRectangle ? userParams.circleSize : springs.scale.value
    renderer.glassParams.scaleRatio = springs.refraction.value
    renderer.glassParams.magnifyingScale = springs.magnification.value
    renderer.glassParams.scaleX = springs.deformationX.value * (isRectangle ? interactionScale : 1)
    renderer.glassParams.scaleY = springs.deformationY.value * (isRectangle ? interactionScale : 1)
    renderer.glassParams.shadowOpacity = springs.shadowOpacity.value
    renderer.glassParams.shadowBlur = springs.shadowBlur.value
    renderer.glassParams.shadowOffsetX = userParams.shadowOffsetX
    renderer.glassParams.shadowOffsetY = springs.shadowOffsetY.value
    renderer.glassParams.specularOpacity = springs.specularOpacity.value
    renderer.glassParams.glassBgOpacity = springs.glassBgOpacity.value
    renderer.glassParams.liquidStrength = 0

    renderer.render()
    requestAnimationFrame(render)
  }

  render()
}

main().catch(console.error)
