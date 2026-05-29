import type { WebGPURenderer } from '../webgpu/renderer'
import type { GlassPreset } from './types'

export interface Spring {
  value: number
  velocity: number
  target: number
  stiffness: number
  damping: number
}

export interface GlassSprings {
  scale: Spring
  refraction: Spring
  magnification: Spring
  deformationX: Spring
  deformationY: Spring
  shadowOpacity: Spring
  shadowBlur: Spring
  shadowOffsetY: Spring
  specularOpacity: Spring
  glassBgOpacity: Spring
  liquid: Spring
}

export function createSpring(value: number, stiffness: number, damping: number): Spring {
  return { value, velocity: 0, target: value, stiffness, damping }
}

export function createGlassSprings(renderer: WebGPURenderer): GlassSprings {
  return {
    scale: createSpring(renderer.glassParams.circleSize, 360, 18),
    refraction: createSpring(renderer.glassParams.scaleRatio, 420, 18),
    magnification: createSpring(renderer.glassParams.magnifyingScale, 360, 22),
    deformationX: createSpring(1.0, 300, 15),
    deformationY: createSpring(1.0, 300, 15),
    shadowOpacity: createSpring(renderer.glassParams.shadowOpacity, 360, 24),
    shadowBlur: createSpring(renderer.glassParams.shadowBlur, 360, 24),
    shadowOffsetY: createSpring(renderer.glassParams.shadowOffsetY, 360, 24),
    specularOpacity: createSpring(renderer.glassParams.specularOpacity, 420, 20),
    glassBgOpacity: createSpring(renderer.glassParams.glassBgOpacity, 800, 50),
    liquid: createSpring(0, 300, 13),
  }
}

export function setSpring(spring: Spring, value: number): void {
  spring.value = value
  spring.target = value
  spring.velocity = 0
}

export function resetGlassSpringsFromPreset(springs: GlassSprings, preset: GlassPreset): void {
  setSpring(springs.scale, preset.circleSize)
  setSpring(springs.refraction, preset.scaleRatio)
  setSpring(springs.magnification, preset.magnifyingScale)
  setSpring(springs.shadowOpacity, preset.shadowOpacity)
  setSpring(springs.shadowBlur, preset.shadowBlur)
  setSpring(springs.shadowOffsetY, preset.shadowOffsetY)
  setSpring(springs.specularOpacity, preset.specularOpacity)
  setSpring(springs.glassBgOpacity, preset.glassBgOpacity)
  setSpring(springs.liquid, 0)
}

export function resetDeformationSprings(springs: GlassSprings): void {
  setSpring(springs.deformationX, 1)
  setSpring(springs.deformationY, 1)
}

export function stepGlassSprings(springs: GlassSprings, dt: number, speed: number): void {
  for (const key in springs) {
    const spring = springs[key as keyof GlassSprings]
    let remaining = dt
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 120)
      const acceleration = (spring.target - spring.value) * spring.stiffness * speed * speed -
        spring.velocity * spring.damping * speed
      spring.velocity += acceleration * step
      spring.value += spring.velocity * step
      remaining -= step
    }
  }
}
