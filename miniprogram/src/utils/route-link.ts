import {
  buildRouteServices,
  generatePlans,
  parsePlannerCriteria,
  plannerDefaults,
  plannerQuery,
  splitDays,
  spots,
  type Plan,
  type PlannerCriteria
} from '@shared/domain'

type RouteParams = Record<string, string | string[] | undefined>

const plansFor = (criteria: PlannerCriteria) => generatePlans(
  criteria.county,
  criteria.startDate,
  criteria.days,
  criteria.theme1,
  criteria.theme2,
  criteria.experience,
  criteria.purpose,
  criteria.travelMode
)

export function defaultSharedPlan (): Plan {
  const plan = plansFor(plannerDefaults())[0]
  if (!plan) throw new Error('默认条件未生成可行路线')
  return plan
}

export function miniPlanPath (plan: Plan): string {
  const spotIds = encodeURIComponent(plan.spots.map((spot) => spot.id).join(','))
  return `/pages/route-detail/index?planId=${encodeURIComponent(plan.id)}&${plannerQuery(plan.criteria)}&spotIds=${spotIds}`
}

export function resolvePlanFromParams (params: RouteParams): Plan | null {
  const rawPlanId = Array.isArray(params.planId) ? params.planId[0] : params.planId
  if (!rawPlanId) return null
  let planId = rawPlanId
  try {
    planId = decodeURIComponent(rawPlanId)
  } catch {}
  const criteria = parsePlannerCriteria(params)
  const basePlan = plansFor(criteria).find((plan) => plan.id === planId)
  if (!basePlan) return null
  const rawSpotIds = Array.isArray(params.spotIds) ? params.spotIds[0] : params.spotIds
  if (!rawSpotIds) return basePlan
  const requestedIds = Array.from(new Set(rawSpotIds.split(',').filter(Boolean)))
  const routeSpots = requestedIds
    .map((spotId) => spots.find((spot) => spot.id === spotId))
    .filter((spot): spot is typeof spots[number] => Boolean(spot))
  if (routeSpots.length < 2 || routeSpots.length !== requestedIds.length) return basePlan
  const days = splitDays(routeSpots, criteria.days, criteria.startDate, criteria.travelMode)
  const restoredSpots = days.flat()
  if (restoredSpots.length < 2) return basePlan
  return {
    ...basePlan,
    spots: restoredSpots,
    days,
    services: buildRouteServices(restoredSpots)
  }
}
