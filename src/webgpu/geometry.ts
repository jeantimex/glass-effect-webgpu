import type { GlassParams, Point, RectSize, ShapeBounds } from './types'

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1
  const displayWidth = canvas.clientWidth * dpr
  const displayHeight = canvas.clientHeight * dpr

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth
    canvas.height = displayHeight
  }
}

export function getGlassRadius(canvas: HTMLCanvasElement, params: GlassParams): number {
  return Math.min(canvas.width, canvas.height) * 0.35 * params.circleSize
}

export function getRectSize(params: GlassParams): RectSize {
  const dpr = window.devicePixelRatio || 1
  const width = params.rectWidth * dpr
  const height = params.rectHeight * dpr
  const radiusPercent = Math.min(Math.max(params.rectRadiusPercent, 0), 100) / 100
  const radius = Math.min(width, height) * 0.5 * radiusPercent

  return { width, height, radius }
}

export function getShapeBounds(canvas: HTMLCanvasElement, params: GlassParams): ShapeBounds {
  if (params.shapeType === 1) {
    const rect = getRectSize(params)
    return {
      halfWidth: rect.width / 2,
      halfHeight: rect.height / 2,
    }
  }

  const radius = getGlassRadius(canvas, params)
  return {
    halfWidth: radius,
    halfHeight: radius,
  }
}

export function clientPointToCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

export function roundedRectDistance(dx: number, dy: number, width: number, height: number, radius: number): number {
  const qx = Math.abs(dx) - (width / 2 - radius)
  const qy = Math.abs(dy) - (height / 2 - radius)
  const outsideX = Math.max(qx, 0)
  const outsideY = Math.max(qy, 0)
  const inside = Math.min(Math.max(qx, qy), 0)

  return Math.sqrt(outsideX * outsideX + outsideY * outsideY) + inside - radius
}

export function isPointInsideGlass(
  canvas: HTMLCanvasElement,
  params: GlassParams,
  glassCenterX: number,
  glassCenterY: number,
  clientX: number,
  clientY: number
): boolean {
  const point = clientPointToCanvasPoint(canvas, clientX, clientY)
  const centerX = glassCenterX * canvas.width
  const centerY = glassCenterY * canvas.height
  const dx = point.x - centerX
  const dy = point.y - centerY

  if (params.shapeType === 1) {
    const rect = getRectSize(params)
    return roundedRectDistance(dx, dy, rect.width, rect.height, rect.radius) <= 0
  }

  return Math.sqrt(dx * dx + dy * dy) <= getGlassRadius(canvas, params)
}
