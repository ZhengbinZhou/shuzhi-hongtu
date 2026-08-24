import {
  buildRouteServices,
  pointFit,
  splitDays,
  spots as allSpots,
  travelEngine,
  type Plan,
  type Spot,
  type TravelMode,
  type TravelResult
} from '@shared/domain'

export type RouteLeg = {
  from: Spot
  to: Spot
  result: TravelResult
}

export type RouteSummary = {
  legs: RouteLeg[]
  driveKm: number
  driveMinutes: number
  visitMinutes: number
}

export function formatDuration (minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  if (hours && rest) return `${hours}小时${rest}分`
  if (hours) return `${hours}小时`
  return `${rest}分钟`
}

export function routeSummary (routeSpots: Spot[], mode: TravelMode): RouteSummary {
  const legs: RouteLeg[] = []
  let driveKm = 0
  let driveMinutes = 0
  let visitMinutes = 0

  routeSpots.forEach((spot, index) => {
    visitMinutes += spot.minutes
    if (index === 0) return
    const result = travelEngine.travel(routeSpots[index - 1], spot, mode)
    legs.push({ from: routeSpots[index - 1], to: spot, result })
    driveKm += result.km
    driveMinutes += result.minutes
  })

  return { legs, driveKm, driveMinutes, visitMinutes }
}

function rebuildPlan (plan: Plan, nextSpots: Spot[]): Plan {
  const days = splitDays(nextSpots, plan.criteria.days, plan.criteria.startDate, plan.criteria.travelMode)
  const spots = days.flat()
  return {
    ...plan,
    spots,
    days,
    services: buildRouteServices(spots),
    score: Math.max(60, plan.score - 1),
    feasible: spots.length >= 2
  }
}

export function moveRouteSpot (plan: Plan, index: number, direction: -1 | 1): Plan {
  const target = index + direction
  if (target < 0 || target >= plan.spots.length) return plan
  const next = [...plan.spots]
  ;[next[index], next[target]] = [next[target], next[index]]
  return rebuildPlan(plan, next)
}

export function replaceRouteSpot (plan: Plan, index: number, candidates: Spot[] = allSpots): Plan {
  const current = plan.spots[index]
  if (!current || current.core) return plan
  const replacement = candidates
    .filter((spot) => spot.region === current.region && !spot.core && !plan.spots.some((item) => item.id === spot.id))
    .sort((left, right) => (
      pointFit(right, plan.criteria.theme1, plan.criteria.theme2, plan.criteria.experience) -
      pointFit(left, plan.criteria.theme1, plan.criteria.theme2, plan.criteria.experience)
    ))[0]
  if (!replacement) return plan
  const next = [...plan.spots]
  next[index] = replacement
  return rebuildPlan(plan, next)
}

export function removeRouteSpot (plan: Plan, index: number): Plan {
  const current = plan.spots[index]
  if (!current || current.core || plan.spots.length <= 2) return plan
  return rebuildPlan(plan, plan.spots.filter((_, spotIndex) => spotIndex !== index))
}
