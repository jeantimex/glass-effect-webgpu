import type { PresetType } from '../glass/types'
import { GlassPresetDefinition } from './base'
import { CircleLensPreset } from './circle-lens'
import { RectanglePreset } from './rectangle'
import { SliderPreset } from './slider'
import { SwitchPreset } from './switch'

export { GlassPresetDefinition } from './base'

export const presetDefinitions = {
  'circle-lens': new CircleLensPreset(),
  rectangle: new RectanglePreset(),
  switch: new SwitchPreset(),
  slider: new SliderPreset(),
} satisfies Record<PresetType, GlassPresetDefinition>

export function getPresetDefinition(type: PresetType): GlassPresetDefinition {
  return presetDefinitions[type]
}
