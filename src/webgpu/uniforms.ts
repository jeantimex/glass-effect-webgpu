import { getGlassRadius, getRectSize } from './geometry'
import type { GlassParams } from './types'

export const GLASS_UNIFORM_BUFFER_SIZE = 352

interface BaseShadowParams {
  opacity: number
  blur: number
  offsetX: number
  offsetY: number
}

interface GlassUniformInput {
  canvas: HTMLCanvasElement
  params: GlassParams
  baseShadow: BaseShadowParams
  startTime: number
  glassCenterX: number
  glassCenterY: number
  switchCenterX: number
  switchCenterY: number
  gridOffset: number
}

export function createGlassUniformData(input: GlassUniformInput): Float32Array {
  const { canvas, params, baseShadow } = input
  const glassRadius = getGlassRadius(canvas, params)
  const rect = getRectSize(params)
  const uniformTime = (performance.now() - input.startTime) / 1000
  const dpr = window.devicePixelRatio || 1

  // Determine which circle gets animated shadow (active circle)
  // Non-active circles use base shadow values
  const activeIdx = params.activeCircleIndex
  const leftShadow = activeIdx === 0
    ? { opacity: params.shadowOpacity, blur: params.shadowBlur, offsetX: params.shadowOffsetX, offsetY: params.shadowOffsetY }
    : baseShadow
  const centerShadow = activeIdx === 1
    ? { opacity: params.shadowOpacity, blur: params.shadowBlur, offsetX: params.shadowOffsetX, offsetY: params.shadowOffsetY }
    : baseShadow
  const rightShadow = activeIdx === 2
    ? { opacity: params.shadowOpacity, blur: params.shadowBlur, offsetX: params.shadowOffsetX, offsetY: params.shadowOffsetY }
    : baseShadow

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
    // Per-circle shadow params - only active circle uses animated values
    leftShadow.opacity,
    leftShadow.blur,
    leftShadow.offsetX,
    leftShadow.offsetY,
    centerShadow.opacity,
    centerShadow.blur,
    centerShadow.offsetX,
    centerShadow.offsetY,
    rightShadow.opacity,
    rightShadow.blur,
    rightShadow.offsetX,
    rightShadow.offsetY,
  ])
}
