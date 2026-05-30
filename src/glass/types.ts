import type { SurfaceType } from './displacement-map'

export const surfaceTypeMap: Record<SurfaceType, number> = {
  'convex-circle': 0,
  'convex-squircle': 1,
  'concave': 2,
  'lip': 3,
}

export type PresetType = 'basic-shape'
export type GlassTheme = 'system' | 'light' | 'dark' | 'custom'
export type CirclePresetStrategy = 'stack' | 'merge'

export interface GlassPreset {
  // Shape
  shapeType: number
  surfaceType: SurfaceType
  circleSize: number
  rectWidth: number
  rectHeight: number
  rectRadiusPercent: number

  // Geometry
  bezelWidth: number
  glassThickness: number
  scaleRatio: number
  maxDisplacementScale: number

  // Refraction
  refractiveIndex: number
  magnifyingScale: number

  // Glass appearance
  glassBgOpacity: number
  pressedGlassBgOpacity: number

  // Blur
  blurAmount: number
  blurType: number
  progressiveBlur: number
  progressiveBlurType: number

  // Specular
  specularType: number
  specularOpacity: number
  specularThickness: number
  specularBlur: number
  specularAngle: number
  specularSaturation: number

  // Shadow
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number

  // Liquid animation
  liquidPressScale: number
  liquidPressRefraction: number
  liquidClickSquash: number
  liquidDragSquash: number
  liquidReleaseSquash: number
  liquidSpeed: number
}

export interface UserParams {
  circleSize: number
  scaleRatio: number
  magnifyingScale: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  specularOpacity: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number
  liquidEnabled: boolean
  liquidPressScale: number
  liquidPressRefraction: number
  liquidSpeed: number
  liquidClickSquash: number
  liquidDragSquash: number
  liquidReleaseSquash: number
}
