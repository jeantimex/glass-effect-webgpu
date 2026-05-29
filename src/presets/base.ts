import type { GlassPreset, PresetType } from '../glass/types'

export abstract class GlassPresetDefinition {
  abstract readonly id: PresetType
  abstract readonly config: GlassPreset

  get supportsIcon(): boolean {
    return false
  }
}
