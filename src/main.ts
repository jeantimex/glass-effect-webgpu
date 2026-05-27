import './style.css'
import { GlassApp } from './glass/app'

async function main() {
  const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement | null
  const displacementCanvas = document.getElementById('displacementMap') as HTMLCanvasElement | null

  if (!mainCanvas || !displacementCanvas) {
    throw new Error('Canvas elements not found')
  }

  await new GlassApp(mainCanvas, displacementCanvas).start()
}

main().catch(console.error)
