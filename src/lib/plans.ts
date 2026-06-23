export const PLANS = {
  starter: {
    name: 'Starter',
    annualPrice: 990,
    monthlyPrice: 99,
    annualPriceId: 'price_1TlbVl2XpGjFKfUMbKp1XHAx',
    monthlyPriceId: 'price_1TlbYy2XpGjFKfUM5QbCvKIa',
    annualSavings: 198,
    monthlyRequestLimit: 200,
    maxLocations: 1,
  },
  // Grandfathered — existing Growth customers keep this plan
  growth: {
    name: 'Growth',
    annualPrice: 199,
    monthlyPrice: 199,
    monthlyRequestLimit: null,
    maxLocations: 5,
  },
  professional: {
    name: 'Professional',
    annualPrice: 1490,
    monthlyPrice: 149,
    annualPriceId: 'price_1Tlbqc2XpGjFKfUMxwXQOUnk',
    monthlyPriceId: 'price_1TlbZh2XpGjFKfUMDg4At86j',
    annualSavings: 298,
    monthlyRequestLimit: null,
    maxLocations: 1,
  },
  agency: {
    name: 'Agency',
    annualPrice: 4990,
    monthlyPrice: 499,
    annualPriceId: 'price_1TlbXp2XpGjFKfUMaEUvshu0',
    monthlyPriceId: 'price_1TlbaB2XpGjFKfUMw4uEqnMD',
    annualSavings: 998,
    monthlyRequestLimit: null,
    maxLocations: 5,
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
    goals: true,
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
    weeklyReport: true,
    reviewTraining: true,
    aiConsultant: true,
    goals: true,
    monthlyReports: true,
    competitorComparison: true,
    sentimentAnalysis: true,
    crisisDetection: true,
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
  if (plan === 'professional' || plan === 'growth') return PLAN_FEATURES.professional
  return PLAN_FEATURES.starter
}

export function canAccess(plan: string | null | undefined, feature: FeatureKey): boolean {
  return getPlanFeatures(plan)[feature]
}
