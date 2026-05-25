export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    priceId: 'price_1Tb8Bf2XpGjFKfUMuZ87NFry',
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

// ── Feature-gating ────────────────────────────────────────────────────────────

export const PLAN_FEATURES = {
  starter: {
    reviewLogging: true,
    aiResponder: true,
    analyticsCharts: true,
    recoveryMode: false,
    toneOptions: false,
    smsCampaigns: false,
    requestHistory: false,
    scorePredictor: false,
    weeklyReport: false,
    reviewTraining: false,
    aiConsultant: false,
    goals: false,
    monthlyReports: false,
    competitorComparison: false,
    sentimentAnalysis: false,
    crisisDetection: false,
  },
  professional: {
    reviewLogging: true,
    aiResponder: true,
    analyticsCharts: true,
    recoveryMode: true,
    toneOptions: true,
    smsCampaigns: true,
    requestHistory: true,
    scorePredictor: true,
    weeklyReport: false,
    reviewTraining: true,
    aiConsultant: true,
    goals: false,
    monthlyReports: false,
    competitorComparison: false,
    sentimentAnalysis: false,
    crisisDetection: false,
  },
  agency: {
    reviewLogging: true,
    aiResponder: true,
    analyticsCharts: true,
    recoveryMode: true,
    toneOptions: true,
    smsCampaigns: true,
    requestHistory: true,
    scorePredictor: true,
    weeklyReport: true,
    reviewTraining: true,
    aiConsultant: true,
    goals: true,
    monthlyReports: true,
    competitorComparison: true,
    sentimentAnalysis: true,
    crisisDetection: true,
  },
} as const

export type FeatureKey = keyof typeof PLAN_FEATURES.starter

export function getPlanFeatures(plan: string | null | undefined) {
  if (plan === 'agency') return PLAN_FEATURES.agency
  if (plan === 'professional') return PLAN_FEATURES.professional
  return PLAN_FEATURES.starter
}

export function canAccess(plan: string | null | undefined, feature: FeatureKey): boolean {
  return getPlanFeatures(plan)[feature]
}
