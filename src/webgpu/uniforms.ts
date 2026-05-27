import type { Circle } from './circle'
import { getGlassRadius, getRectSize } from './geometry'
import type { GlassParams } from './types'

export const GLASS_UNIFORM_BUFFER_SIZE = 352

interface GlassUniformInput {
  canvas: HTMLCanvasElement
  params: GlassParams
  circles?: Circle[]
  startTime: number
  glassCenterX: number
  glassCenterY: number
  switchCenterX: number
  switchCenterY: number
  gridOffset: number
}

export function createGlassUniformData(input: GlassUniformInput): Float32Array {
  const { canvas, params, circles } = input
  const glassRadius = getGlassRadius(canvas, params)
  const rect = getRectSize(params)
  const uniformTime = (performance.now() - input.startTime) / 1000
  const dpr = window.devicePixelRatio || 1

  // Get per-circle shadow params (default to global params if no circles)
  const leftCircle = circles?.[0]
  const centerCircle = circles?.[1]
  const rightCircle = circles?.[2]

  return new Float32Array([
    canvas.width,
    canvas.height,
    uniformTime,
    input.glassCenterX * canvas.width,
    input.glassCenterY * canvas.height,
    glassRadius,
    params.bezelWidth,
    params.glassThickness,
    params.scaleRatio,
    params.surfaceType,
    params.gridCellSize,
    params.gridSpeed,
    params.specularOpacity,
    params.specularAngle,
    params.bgBrightness,
    dpr,
    params.specularSaturation,
    params.specularType,
    params.progressiveBlurType,
    params.scaleX,
    params.scaleY,
    params.blurAmount,
    params.shadowOpacity,
    params.shadowBlur,
    params.shadowOffsetX,
    params.shadowOffsetY,
    params.progressiveBlur,
    params.glassBgOpacity,
    params.refractiveIndex,
    params.magnifyingScale,
    params.useImageBg ? 1.0 : 0.0,
    input.gridOffset,
    params.shapeType,
    rect.width,
    rect.height,
    rect.radius,
    params.blurType,
    params.glassTintR,
    params.glassTintG,
    params.glassTintB,
    params.switchMode ? 1.0 : 0.0,
    params.sliderMode ? 1.0 : 0.0,
    params.switchProgress,
    params.switchTrackWidth * dpr,
    params.switchTrackHeight * dpr,
    input.switchCenterX * canvas.width,
    input.switchCenterY * canvas.height,
    params.switchTrackOffOpacity,
    params.switchTrackOnOpacity,
    params.maxDisplacementScale,
    params.splitMenuMode ? 1.0 : 0.0,
    params.splitMenuProgress,
    params.liquidEnabled ? 1.0 : 0.0,
    params.iconType,
    params.iconOpacity,
    params.iconScale,
    params.iconColorR,
    params.iconColorG,
    params.iconColorB,
    params.articleMode ? 1.0 : 0.0,
    params.chromaticAberration ? 1.0 : 0.0,
    params.chromaticStrength,
    params.chromaticBase,
    params.playerControlsMode ? 1.0 : 0.0,
    params.sideCircleOffset * dpr,
    params.sideCircleScale,
    params.activeCircleIndex,
    params.leftCircleSize,
    params.centerCircleSize,
    params.rightCircleSize,
    // Per-circle shadow params (left)
    leftCircle?.shadowOpacity ?? params.shadowOpacity,
    leftCircle?.shadowBlur ?? params.shadowBlur,
    leftCircle?.shadowOffsetX ?? params.shadowOffsetX,
    leftCircle?.shadowOffsetY ?? params.shadowOffsetY,
    // Per-circle shadow params (center)
    centerCircle?.shadowOpacity ?? params.shadowOpacity,
    centerCircle?.shadowBlur ?? params.shadowBlur,
    centerCircle?.shadowOffsetX ?? params.shadowOffsetX,
    centerCircle?.shadowOffsetY ?? params.shadowOffsetY,
    // Per-circle shadow params (right)
    rightCircle?.shadowOpacity ?? params.shadowOpacity,
    rightCircle?.shadowBlur ?? params.shadowBlur,
    rightCircle?.shadowOffsetX ?? params.shadowOffsetX,
    rightCircle?.shadowOffsetY ?? params.shadowOffsetY,
  ])
}
