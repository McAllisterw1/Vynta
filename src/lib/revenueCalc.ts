// Review-sensitivity multipliers by business type
// High = customers rely heavily on reviews before choosing; Low = relationship/referral driven
const INDUSTRY_MULTIPLIERS: Record<string, number> = {
  "Restaurant":       1.35,
  "Bakery":           1.3,
  "Salon":            1.3,
  "Med Spa":          1.25,
  "Tattoo Shop":      1.25,
  "Nail Salon":       1.25,
  "Barber":           1.2,
  "Catering":         1.2,
  "Dentist":          1.15,
  "Gym / Fitness":    1.15,
  "Veterinary":       1.15,
  "Auto Repair":      1.1,
  "Photography":      1.1,
  "Cleaning":         1.05,
  "Pest Control":     1.05,
  "Plumber":          1.0,
  "HVAC":             1.0,
  "Electrician":      1.0,
  "Roofer":           1.0,
  "Landscaper":       1.0,
  "Contractor":       1.0,
  "Painter":          1.0,
  "Flooring":         1.0,
  "Pool Service":     1.0,
  "Locksmith":        0.95,
  "Moving":           0.95,
  "Junk Removal":     0.95,
  "Pressure Washing": 0.95,
  "Real Estate":      0.85,
  "Tax Prep":         0.85,
  "Other":            1.0,
};

export function getIndustryMultiplier(businessType?: string | null): number {
  if (!businessType) return 1.0;
  return INDUSTRY_MULTIPLIERS[businessType] ?? 1.0;
}

export interface RevenueInputs {
  avgCustomerValue: number;
  monthlyNewCustomers: number;
  googleTrafficPercent: number;   // 0–100
  targetRating: number;
  currentRating: number;
  repeatCustomersPerYear?: number | null;
  grossMarginPercent?: number | null;
  unrespondedCount?: number;
  businessType?: string | null;
}

export interface RevenueEstimate {
  reviewInfluencedMonthly: number;
  monthlyLow: number;
  monthlyHigh: number;
  annualLow: number;
  annualHigh: number;
  profitMonthlyLow?: number;
  profitMonthlyHigh?: number;
  ltv?: number;
  confidence: "medium" | "high";
  ratingGap: number;
  industryMultiplier: number;
  // Breakdown: what's driving the loss
  ratingGapMonthlyLow: number;
  ratingGapMonthlyHigh: number;
  unrespondedMonthlyLow: number;
  unrespondedMonthlyHigh: number;
  // Recovery potential (same magnitude as at-risk, framed positively)
  recoveryMonthlyLow: number;
  recoveryMonthlyHigh: number;
  recoveryAnnualLow: number;
  recoveryAnnualHigh: number;
}

// Research basis:
//  - BrightLocal/Harvard: ~9–15% revenue lift per 1-star improvement
//  - Unresponded negative reviews: each carries ~1.5% additional conversion risk (capped at 20%)
//  - Industry multiplier adjusts for how review-sensitive each business category is
export function calculateRevenueAtRisk(inputs: RevenueInputs): RevenueEstimate {
  const {
    avgCustomerValue,
    monthlyNewCustomers,
    googleTrafficPercent,
    targetRating,
    currentRating,
    repeatCustomersPerYear,
    grossMarginPercent,
    unrespondedCount = 0,
    businessType,
  } = inputs;

  const ratingGap = Math.max(0, targetRating - currentRating);
  const industryMultiplier = getIndustryMultiplier(businessType);

  // The slice of monthly revenue actually influenced by online reviews
  const reviewInfluencedMonthly = monthlyNewCustomers * (googleTrafficPercent / 100) * avgCustomerValue;

  // Unresponded review modifier — capped at +20%
  const unrespondedModifier = Math.min(unrespondedCount * 0.015, 0.20);

  // Rating gap contribution (industry-weighted)
  const ratingLossLow  = ratingGap * 0.09 * industryMultiplier;
  const ratingLossHigh = ratingGap * 0.15 * industryMultiplier;
  const ratingGapMonthlyLow  = Math.round(reviewInfluencedMonthly * ratingLossLow);
  const ratingGapMonthlyHigh = Math.round(reviewInfluencedMonthly * ratingLossHigh);

  // Unresponded review contribution
  const unrespondedMonthlyLow  = Math.round(reviewInfluencedMonthly * unrespondedModifier * 0.5);
  const unrespondedMonthlyHigh = Math.round(reviewInfluencedMonthly * unrespondedModifier);

  const monthlyLow  = ratingGapMonthlyLow  + unrespondedMonthlyLow;
  const monthlyHigh = ratingGapMonthlyHigh + unrespondedMonthlyHigh;
  const annualLow   = monthlyLow * 12;
  const annualHigh  = monthlyHigh * 12;

  let profitMonthlyLow: number | undefined;
  let profitMonthlyHigh: number | undefined;
  if (grossMarginPercent) {
    profitMonthlyLow  = Math.round(monthlyLow  * (grossMarginPercent / 100));
    profitMonthlyHigh = Math.round(monthlyHigh * (grossMarginPercent / 100));
  }

  let ltv: number | undefined;
  if (repeatCustomersPerYear && repeatCustomersPerYear > 1) {
    ltv = Math.round(avgCustomerValue * repeatCustomersPerYear);
  }

  const confidence: "medium" | "high" =
    grossMarginPercent && repeatCustomersPerYear ? "high" : "medium";

  return {
    reviewInfluencedMonthly: Math.round(reviewInfluencedMonthly),
    monthlyLow,
    monthlyHigh,
    annualLow,
    annualHigh,
    profitMonthlyLow,
    profitMonthlyHigh,
    ltv,
    confidence,
    ratingGap,
    industryMultiplier,
    ratingGapMonthlyLow,
    ratingGapMonthlyHigh,
    unrespondedMonthlyLow,
    unrespondedMonthlyHigh,
    recoveryMonthlyLow: monthlyLow,
    recoveryMonthlyHigh: monthlyHigh,
    recoveryAnnualLow: annualLow,
    recoveryAnnualHigh: annualHigh,
  };
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}
