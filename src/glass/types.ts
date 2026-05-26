import type { SurfaceType } from './displacement-map'

export const surfaceTypeMap: Record<SurfaceType, number> = {
  'convex-circle': 0,
  'convex-squircle': 1,
  'concave': 2,
  'lip': 3,
}

export type PresetType = 'circle-lens' | 'rectangle' | 'switch' | 'slider' | 'panel' | 'split-menu'
export type GlassTheme = 'system' | 'light' | 'dark' | 'custom'

export interface GlassPreset {
  shapeType: number
  surfaceType: SurfaceType
  bezelWidth: number
  glassThickness: number
  refractiveIndex: number
  magnifyingScale: number
  circleSize: number
  rectWidth: number
  rectHeight: number
  rectRadiusPercent: number
  switchTrackWidth: number
  switchTrackHeight: number
  switchTrackOffOpacity: number
  switchTrackOnOpacity: number
  maxDisplacementScale: number
  trackProgress: number
  scaleRatio: number
  blurAmount: number
  blurType: number
  progressiveBlur: number
  progressiveBlurType: number
  glassBgOpacity: number
  pressedGlassBgOpacity: number
  specularType: number
  specularOpacity: number
  specularAngle: number
  specularSaturation: number
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
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
  forceActive: boolean
  liquidEnabled: boolean
  splitMenuOpen: boolean
  splitMenuProgress: number
  liquidPressScale: number
  liquidPressRefraction: number
  liquidSpeed: number
  liquidClickSquash: number
  liquidDragSquash: number
  liquidReleaseSquash: number
}
