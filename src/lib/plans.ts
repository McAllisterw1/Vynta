export const PLANS = {
  starter: {
    name: 'Starter',
    price: 99,
    monthlyRequestLimit: 200,
    maxLocations: 1,
    aiAutoPosting: false,
    competitorBenchmarking: false,
    whiteLabelDashboard: false,
  },
  growth: {
    name: 'Growth',
    price: 199,
    monthlyRequestLimit: null,
    maxLocations: 5,
    aiAutoPosting: true,
    competitorBenchmarking: true,
    whiteLabelDashboard: false,
  },
  agency: {
    name: 'Agency',
    price: 399,
    monthlyRequestLimit: null,
    maxLocations: null,
    aiAutoPosting: true,
    competitorBenchmarking: true,
    whiteLabelDashboard: true,
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getPlan(key: string | null | undefined) {
  if (!key || !(key in PLANS)) return null
  return PLANS[key as PlanKey]
}
