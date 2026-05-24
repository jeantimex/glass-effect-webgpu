import './style.css'
import { WebGPURenderer } from './webgpu/renderer'

async function main() {
  const canvas = document.createElement('canvas')
  document.body.appendChild(canvas)

  const renderer = new WebGPURenderer(canvas)
  await renderer.init('/assets/banner.jpeg')

  function render() {
    renderer.render()
    requestAnimationFrame(render)
  }

  render()
}

main().catch(console.error)
