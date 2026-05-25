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

type PresetType = 'circle-lens' | 'pill'

interface GlassPreset {
  shapeType: number
  surfaceType: SurfaceType
  bezelWidth: number
  glassThickness: number
  refractiveIndex: number
  magnifyingScale: number
  circleSize: number
  pillWidth: number
  pillHeight: number
  scaleRatio: number
  blurAmount: number
  progressiveBlur: number
  glassBgOpacity: number
  specularOpacity: number
  specularAngle: number
  specularSaturation: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
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
    pillWidth: 420,
    pillHeight: 96,
    scaleRatio: 1,
    blurAmount: 0,
    progressiveBlur: 0,
    glassBgOpacity: 0,
    specularOpacity: 0.4,
    specularAngle: 60,
    specularSaturation: 4,
    shadowOpacity: 0.1,
    shadowBlur: 30,
    shadowOffsetX: 0,
    shadowOffsetY: 15,
  },
  pill: {
    shapeType: 1,
    surfaceType: 'convex-squircle',
    bezelWidth: 60,
    glassThickness: 50,
    refractiveIndex: 1.5,
    magnifyingScale: 0,
    circleSize: 1,
    pillWidth: 420,
    pillHeight: 96,
    scaleRatio: 1,
    blurAmount: 0,
    progressiveBlur: 0,
    glassBgOpacity: 0.08,
    specularOpacity: 0.4,
    specularAngle: 60,
    specularSaturation: 4,
    shadowOpacity: 0.12,
    shadowBlur: 26,
    shadowOffsetX: 0,
    shadowOffsetY: 12,
  },
}

async function main() {
  const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement
  const displacementCanvas = document.getElementById('displacementMap') as HTMLCanvasElement
  const circleSizeSlider = document.getElementById('circleSize') as HTMLInputElement
  const pillWidthSlider = document.getElementById('pillWidth') as HTMLInputElement
  const pillHeightSlider = document.getElementById('pillHeight') as HTMLInputElement

  if (!mainCanvas || !displacementCanvas) {
    throw new Error('Canvas elements not found')
  }

  // Initialize WebGPU renderer
  const renderer = new WebGPURenderer(mainCanvas)
  await renderer.init()

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
      renderer.glassParams.scaleRatio
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

    renderer.glassParams.circleSize = clampedSize
    if (circleSizeSlider) {
      circleSizeSlider.value = clampedSize.toFixed(2)
    }
  }

  function setPillWidth(width: number) {
    const min = pillWidthSlider ? parseFloat(pillWidthSlider.min) : 160
    const max = pillWidthSlider ? parseFloat(pillWidthSlider.max) : 760
    const clampedWidth = Math.min(Math.max(width, min), max)

    renderer.glassParams.pillWidth = clampedWidth
    if (pillWidthSlider) {
      pillWidthSlider.value = String(clampedWidth)
    }
  }

  function setPillHeight(height: number) {
    const min = pillHeightSlider ? parseFloat(pillHeightSlider.min) : 48
    const max = pillHeightSlider ? parseFloat(pillHeightSlider.max) : 240
    const clampedHeight = Math.min(Math.max(height, min), max)

    renderer.glassParams.pillHeight = clampedHeight
    if (pillHeightSlider) {
      pillHeightSlider.value = String(clampedHeight)
    }
  }

  mainCanvas.addEventListener('pointerdown', (event) => {
    if (!renderer.isPointInsideGlass(event.clientX, event.clientY)) return

    draggingGlass = true
    glassDragOffset = renderer.getGlassDragOffset(event.clientX, event.clientY)
    mainCanvas.style.cursor = 'grabbing'
    mainCanvas.setPointerCapture(event.pointerId)
    event.preventDefault()
  })

  mainCanvas.addEventListener('pointermove', (event) => {
    if (!draggingGlass) {
      updateCanvasCursor(event)
      return
    }

    renderer.setGlassCenterFromClientPoint(event.clientX, event.clientY, glassDragOffset)
    event.preventDefault()
  })

  mainCanvas.addEventListener('pointerup', (event) => {
    draggingGlass = false
    if (mainCanvas.hasPointerCapture(event.pointerId)) {
      mainCanvas.releasePointerCapture(event.pointerId)
    }
    updateCanvasCursor(event)
  })

  mainCanvas.addEventListener('pointercancel', (event) => {
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
      setPillWidth(renderer.glassParams.pillWidth + direction * 24)
      setPillHeight(renderer.glassParams.pillHeight + direction * 6)
    } else {
      setCircleSize(renderer.glassParams.circleSize + direction * 0.04)
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
  const blurAmountSlider = document.getElementById('blurAmount') as HTMLInputElement
  const progressiveBlurSlider = document.getElementById('progressiveBlur') as HTMLInputElement
  const glassBgOpacitySlider = document.getElementById('glassBgOpacity') as HTMLInputElement
  const shadowOpacitySlider = document.getElementById('shadowOpacity') as HTMLInputElement
  const shadowBlurSlider = document.getElementById('shadowBlur') as HTMLInputElement
  const shadowOffsetXSlider = document.getElementById('shadowOffsetX') as HTMLInputElement
  const shadowOffsetYSlider = document.getElementById('shadowOffsetY') as HTMLInputElement
  const circleOnlyControls = document.querySelectorAll<HTMLElement>('.circle-only-control')
  const pillOnlyControls = document.querySelectorAll<HTMLElement>('.pill-only-control')

  function setSliderValue(slider: HTMLInputElement | null, value: number) {
    if (slider) slider.value = String(value)
  }

  function updateShapeControls() {
    const isPill = renderer.glassParams.shapeType === 1
    circleOnlyControls.forEach((control) => {
      control.classList.toggle('hidden', isPill)
    })
    pillOnlyControls.forEach((control) => {
      control.classList.toggle('hidden', !isPill)
    })
  }

  function applyPreset(type: PresetType) {
    const preset = presets[type]
    renderer.glassParams.shapeType = preset.shapeType
    currentSurfaceType = preset.surfaceType
    renderer.glassParams.surfaceType = surfaceTypeMap[preset.surfaceType]
    renderer.glassParams.bezelWidth = preset.bezelWidth
    renderer.glassParams.glassThickness = preset.glassThickness
    renderer.glassParams.refractiveIndex = preset.refractiveIndex
    renderer.glassParams.magnifyingScale = preset.magnifyingScale
    renderer.glassParams.circleSize = preset.circleSize
    renderer.glassParams.pillWidth = preset.pillWidth
    renderer.glassParams.pillHeight = preset.pillHeight
    renderer.glassParams.scaleRatio = preset.scaleRatio
    renderer.glassParams.blurAmount = preset.blurAmount
    renderer.glassParams.progressiveBlur = preset.progressiveBlur
    renderer.glassParams.glassBgOpacity = preset.glassBgOpacity
    renderer.glassParams.specularOpacity = preset.specularOpacity
    renderer.glassParams.specularAngle = preset.specularAngle * Math.PI / 180
    renderer.glassParams.specularSaturation = preset.specularSaturation
    renderer.glassParams.shadowOpacity = preset.shadowOpacity
    renderer.glassParams.shadowBlur = preset.shadowBlur
    renderer.glassParams.shadowOffsetX = preset.shadowOffsetX
    renderer.glassParams.shadowOffsetY = preset.shadowOffsetY

    surfaceButtons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-surface') === preset.surfaceType)
    })
    setSliderValue(bezelSlider, preset.bezelWidth)
    setSliderValue(thicknessSlider, preset.glassThickness)
    setSliderValue(refractiveIndexSlider, preset.refractiveIndex)
    setSliderValue(magnifyingScaleSlider, preset.magnifyingScale)
    setSliderValue(circleSizeSlider, preset.circleSize)
    setSliderValue(pillWidthSlider, preset.pillWidth)
    setSliderValue(pillHeightSlider, preset.pillHeight)
    setSliderValue(scaleSlider, preset.scaleRatio)
    setSliderValue(blurAmountSlider, preset.blurAmount)
    setSliderValue(progressiveBlurSlider, preset.progressiveBlur)
    setSliderValue(glassBgOpacitySlider, preset.glassBgOpacity)
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
    renderer.glassParams.magnifyingScale = parseFloat(magnifyingScaleSlider.value)
  })

  circleSizeSlider?.addEventListener('input', () => {
    setCircleSize(parseFloat(circleSizeSlider.value))
  })

  pillWidthSlider?.addEventListener('input', () => {
    setPillWidth(parseFloat(pillWidthSlider.value))
  })

  pillHeightSlider?.addEventListener('input', () => {
    setPillHeight(parseFloat(pillHeightSlider.value))
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
    renderer.glassParams.scaleRatio = parseFloat(scaleSlider.value)
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
    renderer.glassParams.specularOpacity = parseFloat(specularOpacitySlider.value)
  })

  specularAngleSlider?.addEventListener('input', () => {
    renderer.glassParams.specularAngle = parseFloat(specularAngleSlider.value) * Math.PI / 180
  })

  specularSaturationSlider?.addEventListener('input', () => {
    renderer.glassParams.specularSaturation = parseFloat(specularSaturationSlider.value)
  })

  blurAmountSlider?.addEventListener('input', () => {
    renderer.glassParams.blurAmount = parseFloat(blurAmountSlider.value)
  })

  progressiveBlurSlider?.addEventListener('input', () => {
    renderer.glassParams.progressiveBlur = parseFloat(progressiveBlurSlider.value)
  })

  glassBgOpacitySlider?.addEventListener('input', () => {
    renderer.glassParams.glassBgOpacity = parseFloat(glassBgOpacitySlider.value)
  })

  const bgBrightnessSlider = document.getElementById('bgBrightness') as HTMLInputElement
  bgBrightnessSlider?.addEventListener('input', () => {
    renderer.glassParams.bgBrightness = parseFloat(bgBrightnessSlider.value)
  })

  shadowOpacitySlider?.addEventListener('input', () => {
    renderer.glassParams.shadowOpacity = parseFloat(shadowOpacitySlider.value)
  })

  shadowBlurSlider?.addEventListener('input', () => {
    renderer.glassParams.shadowBlur = parseFloat(shadowBlurSlider.value)
  })

  shadowOffsetXSlider?.addEventListener('input', () => {
    renderer.glassParams.shadowOffsetX = parseFloat(shadowOffsetXSlider.value)
  })

  shadowOffsetYSlider?.addEventListener('input', () => {
    renderer.glassParams.shadowOffsetY = parseFloat(shadowOffsetYSlider.value)
  })

  // Handle resize for displacement map canvas
  const resizeObserver = new ResizeObserver(() => {
    updateDisplacementMap()
  })
  resizeObserver.observe(displacementCanvas)

  // Render loop
  function render() {
    renderer.render()
    requestAnimationFrame(render)
  }

  render()
}

main().catch(console.error)
