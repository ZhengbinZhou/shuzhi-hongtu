import Taro from '@tarojs/taro'
import type { Plan } from '@shared/domain'
import {
  isPlan,
  normalizeCompletedSpotIds,
  parseSavedRoutes,
  removeSavedRoute,
  upsertSavedRoute,
  type SavedRoute
} from '../utils/route-state'

const SAVED_ROUTES_KEY = 'shuzhi-hongtu:saved-routes'
const ACTIVE_ROUTE_KEY = 'shuzhi-hongtu:active-route'
const progressKey = (planId: string) => `shuzhi-hongtu:route-progress:${planId}`

export function loadSavedRoutes (): SavedRoute[] {
  try {
    return parseSavedRoutes(Taro.getStorageSync(SAVED_ROUTES_KEY))
  } catch {
    return []
  }
}

export function saveRoute (plan: Plan): SavedRoute[] {
  const next = upsertSavedRoute(loadSavedRoutes(), plan)
  Taro.setStorageSync(SAVED_ROUTES_KEY, next)
  return next
}

export function removeRoute (savedId: string): SavedRoute[] {
  const next = removeSavedRoute(loadSavedRoutes(), savedId)
  Taro.setStorageSync(SAVED_ROUTES_KEY, next)
  return next
}

export function setActiveRoute (plan: Plan): void {
  Taro.setStorageSync(ACTIVE_ROUTE_KEY, plan)
}

export function getActiveRoute (): Plan | null {
  try {
    const value = Taro.getStorageSync(ACTIVE_ROUTE_KEY)
    return isPlan(value) ? value : null
  } catch {
    return null
  }
}

export function loadCompletedSpotIds (plan: Plan): string[] {
  try {
    return normalizeCompletedSpotIds(plan, Taro.getStorageSync(progressKey(plan.id)))
  } catch {
    return []
  }
}

export function toggleCompletedSpot (plan: Plan, spotId: string): string[] {
  const current = loadCompletedSpotIds(plan)
  const next = current.includes(spotId)
    ? current.filter((id) => id !== spotId)
    : normalizeCompletedSpotIds(plan, [...current, spotId])
  Taro.setStorageSync(progressKey(plan.id), next)
  return next
}
