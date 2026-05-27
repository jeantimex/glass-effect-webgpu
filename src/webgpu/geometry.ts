import type { GlassParams, Point, RectSize, ShapeBounds, SwitchMetrics } from './types'

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

export function getSwitchMetrics(
  canvas: HTMLCanvasElement,
  params: GlassParams,
  switchCenterX: number,
  switchCenterY: number
): SwitchMetrics {
  const dpr = window.devicePixelRatio || 1
  const trackWidth = params.switchTrackWidth * dpr
  const trackHeight = params.switchTrackHeight * dpr
  const thumbWidth = params.rectWidth * dpr
  const thumbHeight = params.rectHeight * dpr
  const centerX = switchCenterX * canvas.width
  const centerY = switchCenterY * canvas.height
  const switchInset = 5 * dpr
  const travel = Math.max(0, trackWidth - Math.max(trackHeight, Math.min(thumbWidth, thumbHeight)) - switchInset * 2)

  return { centerX, centerY, trackWidth, trackHeight, travel }
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

export function isPointInsideSplitMenu(
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
  const dpr = window.devicePixelRatio || 1

  // Use scaled coordinates relative to center
  const dx = (point.x - centerX) / params.scaleX
  const dy = (point.y - centerY) / params.scaleY

  const baseRadius = getGlassRadius(canvas, params)
  const progress = params.splitMenuProgress
  const splitDist = 320.0 * dpr * progress

  // Pill dimensions
  const pillWidth = params.splitMenuPillWidth * dpr
  const pillHeight = params.splitMenuPillHeight * dpr
  const pillRadius = Math.min(params.splitMenuPillRadius * dpr, Math.min(pillWidth, pillHeight) * 0.5)

  const currentWidth = baseRadius * 2 + (pillWidth - baseRadius * 2) * progress
  const currentHeight = baseRadius * 2 + (pillHeight - baseRadius * 2) * progress
  const currentRadius = baseRadius + (pillRadius - baseRadius) * progress

  const offsetX = (baseRadius - currentWidth * 0.5) * 0.5
  const splitDistLeft = offsetX - splitDist * 0.5
  const splitDistRight = offsetX + splitDist * 0.5

  // Check circle (left)
  const distCircle = Math.sqrt((dx - splitDistLeft) ** 2 + dy ** 2)
  if (distCircle <= baseRadius) return true

  // Check pill (right)
  const distRect = roundedRectDistance(dx - splitDistRight, dy, currentWidth, currentHeight, currentRadius)

  return distRect <= 0
}

export function getClickedSplitMenuIndex(
  canvas: HTMLCanvasElement,
  params: GlassParams,
  glassCenterX: number,
  glassCenterY: number,
  clientX: number,
  clientY: number
): number {
  const point = clientPointToCanvasPoint(canvas, clientX, clientY)
  const centerX = glassCenterX * canvas.width
  const centerY = glassCenterY * canvas.height
  const dpr = window.devicePixelRatio || 1

  const dx = (point.x - centerX) / params.scaleX
  const dy = (point.y - centerY) / params.scaleY

  const baseRadius = getGlassRadius(canvas, params)
  const progress = params.splitMenuProgress
  const splitDist = 320.0 * dpr * progress

  // Pill dimensions
  const pillWidth = params.splitMenuPillWidth * dpr
  const pillHeight = params.splitMenuPillHeight * dpr
  const pillRadius = Math.min(params.splitMenuPillRadius * dpr, Math.min(pillWidth, pillHeight) * 0.5)

  const currentWidth = baseRadius * 2 + (pillWidth - baseRadius * 2) * progress
  const currentHeight = baseRadius * 2 + (pillHeight - baseRadius * 2) * progress
  const currentRadius = baseRadius + (pillRadius - baseRadius) * progress

  const offsetX = (baseRadius - currentWidth * 0.5) * 0.5
  const splitDistLeft = offsetX - splitDist * 0.5
  const splitDistRight = offsetX + splitDist * 0.5

  // Check circle (left) - index 0
  const distCircle = Math.sqrt((dx - splitDistLeft) ** 2 + dy ** 2)
  if (distCircle <= baseRadius) return 0

  // Check pill (right) - index 1
  const distRect = roundedRectDistance(dx - splitDistRight, dy, currentWidth, currentHeight, currentRadius)
  if (distRect <= 0) return 1

  return -1
}

export function isPointInsideSwitchTrack(
  canvas: HTMLCanvasElement,
  params: GlassParams,
  switchCenterX: number,
  switchCenterY: number,
  clientX: number,
  clientY: number
): boolean {
  if (!params.switchMode && !params.sliderMode) return false

  const point = clientPointToCanvasPoint(canvas, clientX, clientY)
  const metrics = getSwitchMetrics(canvas, params, switchCenterX, switchCenterY)
  const radius = metrics.trackHeight / 2
  return roundedRectDistance(
    point.x - metrics.centerX,
    point.y - metrics.centerY,
    metrics.trackWidth,
    metrics.trackHeight,
    radius
  ) <= 0
}
