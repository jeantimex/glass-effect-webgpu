import type { PresetType } from '../glass/types'
import { GlassPresetDefinition } from './base'
import { BasicShapePreset } from './basic-shape'

export { GlassPresetDefinition } from './base'

export const presetDefinitions = {
  'basic-shape': new BasicShapePreset(),
} satisfies Record<PresetType, GlassPresetDefinition>

export function getPresetDefinition(type: PresetType): GlassPresetDefinition {
  return presetDefinitions[type]
}
