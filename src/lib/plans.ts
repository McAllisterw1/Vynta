export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    monthlyRequestLimit: 200,
    maxLocations: 1,
    aiAutoPosting: false,
    competitorBenchmarking: false,
    whiteLabelDashboard: false,
  },
  // Grandfathered — existing Growth customers keep this plan
  growth: {
    name: 'Growth',
    price: 199,
    monthlyRequestLimit: null,
    maxLocations: 5,
    aiAutoPosting: true,
    competitorBenchmarking: true,
    whiteLabelDashboard: false,
  },
  professional: {
    name: 'Professional',
    yearlyPrice: 990,
    // TODO: replace with Stripe yearly price ID for Professional ($990/yr)
    yearlyPriceId: 'price_1TTYgRFVvYQFnNKtkLbjDOre',
    monthlyRequestLimit: null,
    maxLocations: 5,
    aiAutoPosting: true,
    competitorBenchmarking: true,
    whiteLabelDashboard: false,
  },
  agency: {
    name: 'Agency',
    yearlyPrice: 1990,
    // TODO: replace with Stripe yearly price ID for Agency ($1,990/yr)
    yearlyPriceId: 'price_1TTYlGFVvYQFnNKtl6DXtrYm',
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
