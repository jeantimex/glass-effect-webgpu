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

async function main() {
  const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement
  const displacementCanvas = document.getElementById('displacementMap') as HTMLCanvasElement
  const circleSizeSlider = document.getElementById('circleSize') as HTMLInputElement

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
    setCircleSize(renderer.glassParams.circleSize + direction * 0.04)
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
  const bezelSlider = document.getElementById('bezelWidth') as HTMLInputElement
  const thicknessSlider = document.getElementById('glassThickness') as HTMLInputElement
  const scaleSlider = document.getElementById('scaleRatio') as HTMLInputElement
  const gridCellSizeSlider = document.getElementById('gridCellSize') as HTMLInputElement

  bezelSlider?.addEventListener('input', () => {
    renderer.glassParams.bezelWidth = parseInt(bezelSlider.value)
    updateDisplacementMap()
  })

  thicknessSlider?.addEventListener('input', () => {
    renderer.glassParams.glassThickness = parseInt(thicknessSlider.value)
    updateDisplacementMap()
  })

  const refractiveIndexSlider = document.getElementById('refractiveIndex') as HTMLInputElement
  refractiveIndexSlider?.addEventListener('input', () => {
    renderer.glassParams.refractiveIndex = parseFloat(refractiveIndexSlider.value)
    updateDisplacementMap()
  })

  const magnifyingScaleSlider = document.getElementById('magnifyingScale') as HTMLInputElement
  magnifyingScaleSlider?.addEventListener('input', () => {
    renderer.glassParams.magnifyingScale = parseFloat(magnifyingScaleSlider.value)
  })

  circleSizeSlider?.addEventListener('input', () => {
    setCircleSize(parseFloat(circleSizeSlider.value))
  })

  const backgroundTypeSelect = document.getElementById('backgroundType') as HTMLSelectElement
  backgroundTypeSelect?.addEventListener('change', () => {
    renderer.setBackground(backgroundTypeSelect.value as BackgroundType).catch(console.error)
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
    renderer.glassParams.gridSpeed = parseFloat(gridSpeedSlider.value)
  })

  const specularOpacitySlider = document.getElementById('specularOpacity') as HTMLInputElement
  specularOpacitySlider?.addEventListener('input', () => {
    renderer.glassParams.specularOpacity = parseFloat(specularOpacitySlider.value)
  })

  const specularAngleSlider = document.getElementById('specularAngle') as HTMLInputElement
  specularAngleSlider?.addEventListener('input', () => {
    renderer.glassParams.specularAngle = parseFloat(specularAngleSlider.value) * Math.PI / 180
  })

  const specularSaturationSlider = document.getElementById('specularSaturation') as HTMLInputElement
  specularSaturationSlider?.addEventListener('input', () => {
    renderer.glassParams.specularSaturation = parseFloat(specularSaturationSlider.value)
  })

  const blurAmountSlider = document.getElementById('blurAmount') as HTMLInputElement
  blurAmountSlider?.addEventListener('input', () => {
    renderer.glassParams.blurAmount = parseFloat(blurAmountSlider.value)
  })

  const progressiveBlurSlider = document.getElementById('progressiveBlur') as HTMLInputElement
  progressiveBlurSlider?.addEventListener('input', () => {
    renderer.glassParams.progressiveBlur = parseFloat(progressiveBlurSlider.value)
  })

  const glassBgOpacitySlider = document.getElementById('glassBgOpacity') as HTMLInputElement
  glassBgOpacitySlider?.addEventListener('input', () => {
    renderer.glassParams.glassBgOpacity = parseFloat(glassBgOpacitySlider.value)
  })

  const bgBrightnessSlider = document.getElementById('bgBrightness') as HTMLInputElement
  bgBrightnessSlider?.addEventListener('input', () => {
    renderer.glassParams.bgBrightness = parseFloat(bgBrightnessSlider.value)
  })

  const shadowOpacitySlider = document.getElementById('shadowOpacity') as HTMLInputElement
  shadowOpacitySlider?.addEventListener('input', () => {
    renderer.glassParams.shadowOpacity = parseFloat(shadowOpacitySlider.value)
  })

  const shadowBlurSlider = document.getElementById('shadowBlur') as HTMLInputElement
  shadowBlurSlider?.addEventListener('input', () => {
    renderer.glassParams.shadowBlur = parseFloat(shadowBlurSlider.value)
  })

  const shadowOffsetXSlider = document.getElementById('shadowOffsetX') as HTMLInputElement
  shadowOffsetXSlider?.addEventListener('input', () => {
    renderer.glassParams.shadowOffsetX = parseFloat(shadowOffsetXSlider.value)
  })

  const shadowOffsetYSlider = document.getElementById('shadowOffsetY') as HTMLInputElement
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
