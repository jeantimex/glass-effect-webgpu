/**
 * HTML-in-Canvas API support
 * https://developer.chrome.com/blog/html-in-canvas-origin-trial
 *
 * This API allows rendering DOM elements directly to WebGPU textures
 * while maintaining interactivity and accessibility.
 */

export interface HTMLInCanvasSupport {
  supported: boolean
  copyElementImageToTexture: boolean
}

/**
 * Check if the HTML-in-Canvas API is supported
 */
export function detectHTMLInCanvasSupport(): HTMLInCanvasSupport {
  // Check if GPUQueue has copyElementImageToTexture
  // This is the key API for WebGPU HTML-in-Canvas
  const hasCopyElementImageToTexture = typeof GPUQueue !== 'undefined' &&
    'copyElementImageToTexture' in GPUQueue.prototype

  // Also check for the 2D canvas version as a secondary indicator
  const hasDrawElementImage = typeof CanvasRenderingContext2D !== 'undefined' &&
    'drawElementImage' in CanvasRenderingContext2D.prototype

  const supported = hasCopyElementImageToTexture || hasDrawElementImage

  return {
    supported,
    copyElementImageToTexture: hasCopyElementImageToTexture
  }
}

/**
 * Enable layoutsubtree on a canvas element
 */
export function enableLayoutSubtree(canvas: HTMLCanvasElement): void {
  canvas.setAttribute('layoutsubtree', '')
}

/**
 * Copy an element's rendered content to a WebGPU texture
 */
export async function copyElementToTexture(
  device: GPUDevice,
  element: HTMLElement,
  texture: GPUTexture
): Promise<void> {
  const queue = device.queue as GPUQueue & {
    copyElementImageToTexture?: (element: HTMLElement, dest: { texture: GPUTexture }) => void
  }

  if (queue.copyElementImageToTexture) {
    queue.copyElementImageToTexture(element, { texture })
  } else {
    throw new Error('copyElementImageToTexture is not supported')
  }
}

/**
 * Set up paint event handler for live updates
 */
export function setupPaintHandler(
  canvas: HTMLCanvasElement,
  callback: () => void
): () => void {
  const handler = () => callback()

  // The paint event fires when canvas children need to be redrawn
  canvas.addEventListener('paint', handler)

  return () => canvas.removeEventListener('paint', handler)
}
