import type { PresetType } from '../glass/types'
import { GlassPresetDefinition } from './base'
import { BasicShapePreset } from './basic-shape'
import { PanelPreset } from './panel'
import { PlayerControlsPreset } from './player-controls'
import { SliderPreset } from './slider'
import { SwitchPreset } from './switch'
import { SplitMenuPreset } from './split-menu'

export { GlassPresetDefinition } from './base'

export const presetDefinitions = {
  'basic-shape': new BasicShapePreset(),
  switch: new SwitchPreset(),
  slider: new SliderPreset(),
  panel: new PanelPreset(),
  'split-menu': new SplitMenuPreset(),
  'player-controls': new PlayerControlsPreset(),
} satisfies Record<PresetType, GlassPresetDefinition>

export function getPresetDefinition(type: PresetType): GlassPresetDefinition {
  return presetDefinitions[type]
}
