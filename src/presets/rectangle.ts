import type { GlassPreset } from '../glass/types'
import { GlassPresetDefinition } from './base'

export class RectanglePreset extends GlassPresetDefinition {
  readonly id = 'rectangle'
  readonly config: GlassPreset = {
    shapeType: 1,
    surfaceType: 'convex-squircle',
    bezelWidth: 60,
    glassThickness: 50,
    refractiveIndex: 1.5,
    magnifyingScale: 0,
    circleSize: 1,
    rectWidth: 420,
    rectHeight: 96,
    rectRadiusPercent: 100,
    switchTrackWidth: 184,
    switchTrackHeight: 67,
    switchTrackOffOpacity: 0.34,
    switchTrackOnOpacity: 0.86,
    trackProgress: 1,
    scaleRatio: 1,
    blurAmount: 0,
    blurType: 1,
    progressiveBlur: 0,
    progressiveBlurType: 0,
    glassBgOpacity: 0.08,
    pressedGlassBgOpacity: 0,
    specularType: 0,
    specularOpacity: 0.4,
    specularAngle: 60,
    specularSaturation: 4,
    shadowOpacity: 0.12,
    shadowBlur: 26,
    shadowOffsetX: 0,
    shadowOffsetY: 12,
    liquidPressScale: 1.16,
    liquidPressRefraction: 1.28,
    liquidClickSquash: 1,
    liquidDragSquash: 1,
    liquidReleaseSquash: 1,
    liquidSpeed: 1,
  }
}
