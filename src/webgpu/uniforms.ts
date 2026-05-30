import { getGlassRadius, getRectSize } from './geometry'
import type { GlassParams } from './types'

export const GLASS_UNIFORM_BUFFER_SIZE = 432

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
  gridOffset: number
}

export function createGlassUniformData(input: GlassUniformInput): Float32Array {
  const { canvas, params, baseShadow } = input
  const glassRadius = getGlassRadius(canvas, params)
  const rect = getRectSize(params)
  const uniformTime = (performance.now() - input.startTime) / 1000
  const dpr = window.devicePixelRatio || 1
  const circlePresetCount = Math.min(params.circlePresetCount, 8)

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
    params.specularThickness,
    params.specularBlur,
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
    // Switch/slider mode (removed - set to 0)
    0, // switchMode
    0, // sliderMode
    0, // switchProgress
    0, // switchTrackWidth
    0, // switchTrackHeight
    0, // switchCenterX
    0, // switchCenterY
    0, // switchTrackOffOpacity
    0, // switchTrackOnOpacity
    params.maxDisplacementScale,
    // Split menu (removed - set to 0)
    0, // splitMenuMode
    0, // splitMenuProgress
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
    // Player controls (removed - set to 0)
    0, // playerControlsMode
    0, // sideCircleOffset
    0, // sideCircleScale
    0, // activeCircleIndex
    0, // leftCircleSize
    0, // centerCircleSize
    0, // rightCircleSize
    0, // playerControlsGroupLiquid
    params.circlePresetMode ? 1.0 : 0.0,
    params.circlePresetStrategy,
    circlePresetCount,
    params.circlePresetActiveIndex,
    // Per-circle shadow params (removed - use base shadow)
    baseShadow.opacity,
    baseShadow.blur,
    baseShadow.offsetX,
    baseShadow.offsetY,
    baseShadow.opacity,
    baseShadow.blur,
    baseShadow.offsetX,
    baseShadow.offsetY,
    baseShadow.opacity,
    baseShadow.blur,
    baseShadow.offsetX,
    baseShadow.offsetY,
    baseShadow.opacity,
    baseShadow.blur,
    baseShadow.offsetX,
    baseShadow.offsetY,
    // Split menu per-item shadows (removed - use 0)
    0, // activeSplitMenuIndex
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // Split menu pill settings (removed - set to 0)
    0,
    0,
    0,
  ])
}
