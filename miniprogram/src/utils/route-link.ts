import {
  generatePlans,
  parsePlannerCriteria,
  plannerDefaults,
  plannerQuery,
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
  return `/pages/route-detail/index?planId=${encodeURIComponent(plan.id)}&${plannerQuery(plan.criteria)}`
}

export function resolvePlanFromParams (params: RouteParams): Plan | null {
  const rawPlanId = Array.isArray(params.planId) ? params.planId[0] : params.planId
  if (!rawPlanId) return null
  let planId = rawPlanId
  try {
    planId = decodeURIComponent(rawPlanId)
  } catch {}
  const criteria = parsePlannerCriteria(params)
  return plansFor(criteria).find((plan) => plan.id === planId) ?? null
}
