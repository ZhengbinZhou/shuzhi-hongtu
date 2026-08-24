import type { Plan } from '@shared/domain'

export type SavedRoute = {
  id: string
  plan: Plan
  savedAt: string
}

const MAX_SAVED_ROUTES = 12

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

export function isPlan (value: unknown): value is Plan {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.score !== 'number') return false
  if (!Array.isArray(value.spots) || !value.spots.every((spot) => isRecord(spot) && typeof spot.id === 'string' && typeof spot.name === 'string')) return false
  if (!Array.isArray(value.days) || !value.days.every(Array.isArray)) return false
  return isRecord(value.criteria) && typeof value.criteria.county === 'string' && typeof value.criteria.startDate === 'string'
}

export function parseSavedRoutes (value: unknown): SavedRoute[] {
  if (!Array.isArray(value)) return []
  return value.reduce<SavedRoute[]>((routes, item, index) => {
    if (!isRecord(item) || typeof item.savedAt !== 'string' || !isPlan(item.plan)) return routes
    routes.push({
      id: typeof item.id === 'string' ? item.id : `legacy-${item.plan.id}-${item.savedAt}-${index}`,
      plan: item.plan,
      savedAt: item.savedAt
    })
    return routes
  }, [])
}

export function upsertSavedRoute (
  routes: SavedRoute[],
  plan: Plan,
  savedAt = new Date().toISOString(),
  savedId = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
): SavedRoute[] {
  return [
    { id: savedId, plan, savedAt },
    ...routes.filter((item) => item.id !== savedId)
  ].slice(0, MAX_SAVED_ROUTES)
}

export function removeSavedRoute (routes: SavedRoute[], savedId: string): SavedRoute[] {
  return routes.filter((item) => item.id !== savedId)
}

export function normalizeCompletedSpotIds (plan: Plan, value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const routeIds = new Set(plan.spots.map((spot) => spot.id))
  return Array.from(new Set(value.filter((id): id is string => typeof id === 'string' && routeIds.has(id))))
}

export function routeProgress (plan: Plan, completedSpotIds: unknown) {
  const completed = normalizeCompletedSpotIds(plan, completedSpotIds).length
  const total = plan.spots.length
  return {
    completed,
    total,
    percent: total ? Math.round(completed / total * 100) : 0
  }
}
