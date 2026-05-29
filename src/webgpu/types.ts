export interface GlassParams {
  // Geometry
  bezelWidth: number
  glassThickness: number
  scaleRatio: number
  surfaceType: number
  maxDisplacementScale: number
  scaleX: number
  scaleY: number

  // Shape
  shapeType: number
  circleSize: number
  rectWidth: number
  rectHeight: number
  rectRadiusPercent: number

  // Refraction
  refractiveIndex: number
  magnifyingScale: number

  // Background
  gridCellSize: number
  gridSpeed: number
  bgBrightness: number
  useImageBg: boolean
  articleMode: boolean

  // Glass appearance
  glassTintR: number
  glassTintG: number
  glassTintB: number
  glassBgOpacity: number

  // Blur
  blurAmount: number
  blurType: number
  progressiveBlur: number
  progressiveBlurType: number

  // Specular
  specularOpacity: number
  specularAngle: number
  specularSaturation: number
  specularType: number

  // Shadow
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number

  // Icon
  iconType: number
  iconOpacity: number
  iconScale: number
  iconColorR: number
  iconColorG: number
  iconColorB: number

  // Chromatic aberration
  chromaticAberration: boolean
  chromaticStrength: number
  chromaticBase: number

  // Liquid animation
  liquidEnabled: boolean

  // Instance management
  circlePresetMode: boolean
  circlePresetStrategy: number
  circlePresetCount: number
  circlePresetActiveIndex: number
}

export type BackgroundType = 'grid' | 'banner' | 'article'

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
