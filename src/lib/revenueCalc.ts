export interface RevenueInputs {
  avgCustomerValue: number;
  monthlyNewCustomers: number;
  googleTrafficPercent: number;   // 0–100
  targetRating: number;
  currentRating: number;
  repeatCustomersPerYear?: number | null;
  grossMarginPercent?: number | null;
  unrespondedCount?: number;
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
}

// Research basis:
//  - BrightLocal/Harvard: ~9–15% revenue lift per 1-star improvement
//  - Unresponded negative reviews: each one carries ~1.5% additional conversion risk (capped at 20%)
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
  } = inputs;

  const ratingGap = Math.max(0, targetRating - currentRating);

  // The slice of monthly revenue actually influenced by online reviews
  const reviewInfluencedMonthly = monthlyNewCustomers * (googleTrafficPercent / 100) * avgCustomerValue;

  // Unresponded review modifier — capped at +20%
  const unrespondedModifier = Math.min(unrespondedCount * 0.015, 0.20);

  // Low estimate: 9% per star + half the unresponded modifier
  // High estimate: 15% per star + full unresponded modifier
  const lossLow  = ratingGap * 0.09 + unrespondedModifier * 0.5;
  const lossHigh = ratingGap * 0.15 + unrespondedModifier;

  const monthlyLow  = Math.round(reviewInfluencedMonthly * lossLow);
  const monthlyHigh = Math.round(reviewInfluencedMonthly * lossHigh);
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
  };
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}
