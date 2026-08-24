import Taro from '@tarojs/taro'
import type { PlannerCriteria } from '@shared/domain'

const PLANNER_PRESET_KEY = 'shuzhi-hongtu:planner-preset'

export type HistoryPlannerContext = {
  id: string
  number: string
  shortTitle: string
  period: string
  intro: string
  spotIds: string[]
}

export type PlannerPreset = {
  criteria: PlannerCriteria
  historyContext: HistoryPlannerContext
}

export function setPlannerPreset (criteria: PlannerCriteria, historyContext: HistoryPlannerContext): void {
  Taro.setStorageSync(PLANNER_PRESET_KEY, { criteria, historyContext })
}

export function takePlannerPreset (): PlannerPreset | null {
  try {
    const value = Taro.getStorageSync(PLANNER_PRESET_KEY) as PlannerPreset | undefined
    Taro.removeStorageSync(PLANNER_PRESET_KEY)
    const context = value?.historyContext
    if (
      !value?.criteria ||
      !context ||
      typeof context.id !== 'string' ||
      typeof context.number !== 'string' ||
      typeof context.shortTitle !== 'string' ||
      typeof context.period !== 'string' ||
      typeof context.intro !== 'string' ||
      !Array.isArray(context.spotIds) ||
      !context.spotIds.every((spotId) => typeof spotId === 'string')
    ) return null
    return value
  } catch {
    return null
  }
}
