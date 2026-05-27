import type { GlassPreset } from '../glass/types'
import { GlassPresetDefinition } from './base'

export class PlayerControlsPreset extends GlassPresetDefinition {
  readonly id = 'player-controls'

  override get supportsIcon(): boolean {
    return true
  }

  readonly config: GlassPreset = {
    shapeType: 0,
    surfaceType: 'convex-circle',
    bezelWidth: 50,
    glassThickness: 40,
    refractiveIndex: 1.5,
    magnifyingScale: 0,
    circleSize: 0.42,
    rectWidth: 420,
    rectHeight: 96,
    rectRadiusPercent: 100,
    switchTrackWidth: 184,
    switchTrackHeight: 67,
    switchTrackOffOpacity: 0.34,
    switchTrackOnOpacity: 0.86,
    maxDisplacementScale: 0.8,
    trackProgress: 1,
    scaleRatio: 1,
    blurAmount: 0,
    blurType: 1,
    progressiveBlur: 0,
    progressiveBlurType: 0,
    glassBgOpacity: 0,
    pressedGlassBgOpacity: 0,
    specularType: 0,
    specularOpacity: 0.35,
    specularAngle: 60,
    specularSaturation: 4,
    shadowOpacity: 0.15,
    shadowBlur: 25,
    shadowOffsetX: 0,
    shadowOffsetY: 12,
    liquidPressScale: 1.1,
    liquidPressRefraction: 1.2,
    liquidClickSquash: 1,
    liquidDragSquash: 1,
    liquidReleaseSquash: 1,
    liquidSpeed: 1,
  }
}
