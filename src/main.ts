import './style.css'
import { GlassApp } from './glass/app'

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

async function main() {
  const appRoot = document.getElementById('app')
  const loadingOverlay = document.getElementById('loadingOverlay')
  const githubLink = document.querySelector<HTMLAnchorElement>('.github-link')
  const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement | null
  const displacementCanvas = document.getElementById('displacementMap') as HTMLCanvasElement | null

  if (!appRoot || !loadingOverlay || !githubLink || !mainCanvas || !displacementCanvas) {
    throw new Error('Canvas elements not found')
  }

  try {
    await new GlassApp(mainCanvas, displacementCanvas).start()
    await waitForNextFrame()
    appRoot.classList.add('scene-loaded')
    githubLink.removeAttribute('style')
  } catch (error) {
    console.error(error)
    appRoot.classList.add('scene-load-error')
    loadingOverlay.setAttribute(
      'aria-label',
      error instanceof Error ? error.message : 'Failed to load scene'
    )
  }
}

main().catch((error) => {
  console.error(error)
})
