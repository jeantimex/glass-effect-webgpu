import type { GlassPreset } from '../glass/types'
import { GlassPresetDefinition } from './base'

export class CircleLensPreset extends GlassPresetDefinition {
  readonly id = 'circle-lens'
  readonly config: GlassPreset = {
    shapeType: 0,
    surfaceType: 'convex-circle',
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
    glassBgOpacity: 0,
    pressedGlassBgOpacity: 0,
    specularType: 0,
    specularOpacity: 0.4,
    specularAngle: 60,
    specularSaturation: 4,
    shadowOpacity: 0.1,
    shadowBlur: 30,
    shadowOffsetX: 0,
    shadowOffsetY: 15,
    liquidPressScale: 1.16,
    liquidPressRefraction: 1.28,
    liquidClickSquash: 1,
    liquidDragSquash: 1,
    liquidReleaseSquash: 1,
    liquidSpeed: 1,
  }
}
