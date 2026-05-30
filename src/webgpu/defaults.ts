import type { GlassParams } from './types'

export function createDefaultGlassParams(): GlassParams {
  return {
    // Geometry
    bezelWidth: 45,
    glassThickness: 10,
    scaleRatio: 1.0,
    surfaceType: 0,
    maxDisplacementScale: 0.8,
    scaleX: 1.0,
    scaleY: 1.0,

    // Shape
    shapeType: 0,
    circleSize: 0.8,
    rectWidth: 420,
    rectHeight: 96,
    rectRadiusPercent: 100,

    // Refraction
    refractiveIndex: 1.5,
    magnifyingScale: 0,

    // Background
    gridCellSize: 105,
    gridSpeed: 40,
    bgBrightness: 1.0,
    useImageBg: false,
    articleMode: false,

    // Glass appearance
    glassTintR: 1,
    glassTintG: 1,
    glassTintB: 1,
    glassBgOpacity: 0,

    // Blur
    blurAmount: 0.0,
    blurType: 1,
    progressiveBlur: 0,
    progressiveBlurType: 0,

    // Specular
    specularOpacity: 0.8,
    specularThickness: 2,
    specularBlur: 2,
    specularAngle: Math.PI / 3,
    specularSaturation: 4.0,
    specularType: 0,

    // Shadow
    shadowOpacity: 0.1,
    shadowBlur: 30,
    shadowOffsetX: 0,
    shadowOffsetY: 15,

    // Icon
    iconType: 0,
    iconOpacity: 0.8,
    iconScale: 0.45,
    iconColorR: 1,
    iconColorG: 1,
    iconColorB: 1,

    // Chromatic aberration
    chromaticAberration: true,
    chromaticStrength: 0.2,
    chromaticBase: 0.4,

    // Liquid animation
    liquidEnabled: true,

    // Instance management
    circlePresetMode: false,
    circlePresetStrategy: 0,
    circlePresetCount: 1,
    circlePresetActiveIndex: 0,
  }
}
