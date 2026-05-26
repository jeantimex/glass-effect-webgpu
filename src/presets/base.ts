import type { GlassPreset, PresetType } from '../glass/types'

export abstract class GlassPresetDefinition {
  abstract readonly id: PresetType
  abstract readonly config: GlassPreset

  get isSwitchMode(): boolean {
    return this.id === 'switch'
  }

  get isSliderMode(): boolean {
    return this.id === 'slider'
  }

  get isTrackPreset(): boolean {
    return this.isSwitchMode || this.isSliderMode
  }
}
