export interface GlassParams {
  bezelWidth: number
  glassThickness: number
  scaleRatio: number
  surfaceType: number
  gridCellSize: number
  gridSpeed: number
  specularOpacity: number
  specularAngle: number
  bgBrightness: number
  specularSaturation: number
  specularType: number
  scaleX: number
  scaleY: number
  blurAmount: number
  blurType: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  progressiveBlur: number
  progressiveBlurType: number
  glassBgOpacity: number
  refractiveIndex: number
  magnifyingScale: number
  circleSize: number
  shapeType: number
  rectWidth: number
  rectHeight: number
  rectRadiusPercent: number
  glassTintR: number
  glassTintG: number
  glassTintB: number
  useImageBg: boolean
  switchMode: boolean
  sliderMode: boolean
  switchProgress: number
  switchTrackWidth: number
  switchTrackHeight: number
  switchTrackOffOpacity: number
  switchTrackOnOpacity: number
  maxDisplacementScale: number
  splitMenuMode: boolean
  splitMenuProgress: number
  activeSplitMenuIndex: number
  splitMenuPillWidth: number
  splitMenuPillHeight: number
  splitMenuPillRadius: number
  liquidEnabled: boolean
  iconType: number
  iconOpacity: number
  iconScale: number
  iconColorR: number
  iconColorG: number
  iconColorB: number
  articleMode: boolean
  chromaticAberration: boolean
  chromaticStrength: number
  chromaticBase: number
  playerControlsMode: boolean
  sideCircleOffset: number
  sideCircleScale: number
  activeCircleIndex: number
  leftCircleSize: number
  centerCircleSize: number
  rightCircleSize: number
}

export type BackgroundType = 'grid' | 'banner' | 'article' | 'video'

export interface Point {
  x: number
  y: number
}

export interface RectSize {
  width: number
  height: number
  radius: number
}

export interface ShapeBounds {
  halfWidth: number
  halfHeight: number
}

export interface SwitchMetrics {
  centerX: number
  centerY: number
  trackWidth: number
  trackHeight: number
  travel: number
}
