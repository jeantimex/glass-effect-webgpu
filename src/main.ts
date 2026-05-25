import './style.css'
import { WebGPURenderer } from './webgpu/renderer'
import {
  SurfaceType,
  calculateDisplacementMap1D,
  renderDisplacementMap2D,
} from './displacement-map'

interface GlassParams {
  surfaceType: SurfaceType
  bezelWidth: number
  glassThickness: number
  scaleRatio: number
}

const REFRACTIVE_INDEX = 1.5 // Fixed at glass refractive index

async function main() {
  const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement
  const displacementCanvas = document.getElementById('displacementMap') as HTMLCanvasElement

  if (!mainCanvas || !displacementCanvas) {
    throw new Error('Canvas elements not found')
  }

  // Initialize WebGPU renderer
  const renderer = new WebGPURenderer(mainCanvas)
  await renderer.init()

  // Glass parameters (matching reference defaults)
  const params: GlassParams = {
    surfaceType: 'convex-circle',
    bezelWidth: 60,
    glassThickness: 50,
    scaleRatio: 1.0,
  }

  // Update displacement map
  function updateDisplacementMap() {
    const displacements1D = calculateDisplacementMap1D(
      params.glassThickness,
      params.bezelWidth,
      params.surfaceType,
      REFRACTIVE_INDEX,
      128
    )
    renderDisplacementMap2D(displacementCanvas, displacements1D, params.bezelWidth, params.scaleRatio)
  }

  // Initial render
  updateDisplacementMap()

  // Surface type buttons
  const surfaceButtons = document.querySelectorAll('.surface-btn')
  surfaceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      surfaceButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      params.surfaceType = btn.getAttribute('data-surface') as SurfaceType
      updateDisplacementMap()
    })
  })

  // Sliders
  const bezelSlider = document.getElementById('bezelWidth') as HTMLInputElement
  const thicknessSlider = document.getElementById('glassThickness') as HTMLInputElement
  const scaleSlider = document.getElementById('scaleRatio') as HTMLInputElement

  bezelSlider?.addEventListener('input', () => {
    params.bezelWidth = parseInt(bezelSlider.value)
    updateDisplacementMap()
  })

  thicknessSlider?.addEventListener('input', () => {
    params.glassThickness = parseInt(thicknessSlider.value)
    updateDisplacementMap()
  })

  scaleSlider?.addEventListener('input', () => {
    params.scaleRatio = parseFloat(scaleSlider.value)
    updateDisplacementMap()
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
