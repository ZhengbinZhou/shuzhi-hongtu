import Taro from '@tarojs/taro'
import type { PlannerCriteria } from '@shared/domain'

const PLANNER_PRESET_KEY = 'shuzhi-hongtu:planner-preset'

export type PlannerPreset = {
  criteria: PlannerCriteria
  label: string
}

export function setPlannerPreset (criteria: PlannerCriteria, label: string): void {
  Taro.setStorageSync(PLANNER_PRESET_KEY, { criteria, label })
}

export function takePlannerPreset (): PlannerPreset | null {
  try {
    const value = Taro.getStorageSync(PLANNER_PRESET_KEY) as PlannerPreset | undefined
    Taro.removeStorageSync(PLANNER_PRESET_KEY)
    if (!value?.criteria || typeof value.label !== 'string') return null
    return value
  } catch {
    return null
  }
}
