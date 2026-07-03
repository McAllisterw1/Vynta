"use client"

import { useState } from "react"
import PricingButton from "./PricingButton"

const PLANS = [
  {
    slug: "starter",
    name: "Starter",
    tagline: "Reputation management essentials for one location.",
    annualPrice: 990,
    monthlyPrice: 99,
    annualSavings: 198,
    featured: false,
    features: [
      "Review logging & management",
      "AI review responder",
      "Smart inbox — auto-monitor new reviews",
      "Goals & AI next-move recommendations",
      "Basic analytics",
      "Founder email support",
    ],
  },
  {
    slug: "professional",
    name: "Professional",
    tagline: "The full Vynta intelligence suite for serious businesses.",
    annualPrice: 1490,
    monthlyPrice: 149,
    annualSavings: 298,
    featured: true,
    features: [
      "Everything in Starter",
      "Review Growth tab with AI ask scripts",
      "6 AI response tones + recovery mode",
      "Google review score predictor",
      "AI review consultant",
      "Review training modules",
      "Competitor tracking & analysis",
      "Sentiment analysis & crisis detection",
      "Monthly reputation reports",
      "Priority support",
    ],
  },
  {
    slug: "agency",
    name: "Agency",
    tagline: "Multi-location reputation intelligence under one roof.",
    annualPrice: 4990,
    monthlyPrice: 499,
    annualSavings: 998,
    featured: false,
    features: [
      "Everything in Professional",
      "Up to 5 locations",
      "Separate dashboard per location",
      "Unified billing & management",
      "Dedicated onboarding support",
    ],
  },
]

export default function Pricing() {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual")

  return (
    <section id="pricing" className="bg-cream py-28">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-12 flex flex-col gap-3 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">Pricing</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-tobacco leading-tight md:text-5xl">
            Simple pricing for{" "}
            <em style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #2D9B8A 0%, #6366F1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>growing local businesses</em>
          </h2>
          <p className="text-tobacco-light leading-relaxed">
            14-day free trial on all plans. Card required to start.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setBilling("annual")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              billing === "annual"
                ? "bg-teal text-cream"
                : "bg-transparent text-tobacco-light border border-cream-border hover:text-tobacco"
            }`}
          >
            Pay annually
          </button>
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              billing === "monthly"
                ? "bg-teal text-cream"
                : "bg-transparent text-tobacco-light border border-cream-border hover:text-tobacco"
            }`}
          >
            Pay monthly
          </button>
          {billing === "annual" && (
            <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
              Save up to $998/yr
            </span>
          )}
        </div>

        {/* Monthly commitment notice */}
        {billing === "monthly" && (
          <p className="mb-8 text-center text-sm font-medium text-tobacco-light">
            Monthly billing — <span className="text-tobacco font-semibold">12-month commitment.</span> You&apos;re billed each month for the full year. Early cancellation does not waive remaining payments.
          </p>
        )}

        {/* Plans */}
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            plan.featured ? (
              <div key={plan.slug} className="relative flex flex-col rounded-sm bg-tobacco p-8 shadow-xl">
                <div className="absolute -top-3.5 left-8 flex gap-2">
                  <span className="rounded-sm bg-teal px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream">
                    Most Popular
                  </span>
                  {billing === "annual" && (
                    <span className="rounded-sm bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tobacco">
                      Save ${plan.annualSavings}
                    </span>
                  )}
                </div>

                <div className="mb-6 pt-2">
                  <h3 className="font-display text-lg font-semibold text-cream">{plan.name}</h3>
                  <p className="mt-1 text-sm text-sand-light/70">{plan.tagline}</p>
                </div>

                <div className="mb-8 border-b border-tobacco-mid pb-8">
                  {billing === "annual" ? (
                    <>
                      <div className="flex items-end gap-1.5">
                        <span className="font-display text-5xl font-bold text-cream leading-none">${plan.annualPrice.toLocaleString()}</span>
                        <span className="mb-1 text-sm text-sand-light/60">/ year</span>
                      </div>
                      <p className="mt-2 text-sm text-sand-light/60">
                        ${Math.round(plan.annualPrice / 12)}/mo equivalent · save ${plan.annualSavings}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-end gap-1.5">
                        <span className="font-display text-5xl font-bold text-cream leading-none">${plan.monthlyPrice}</span>
                        <span className="mb-1 text-sm text-sand-light/60">/ month</span>
                      </div>
                      <p className="mt-2 text-sm text-sand-light/60">12-month commitment · billed monthly</p>
                    </>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-teal-light">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-sand-light/80">{f}</span>
                    </li>
                  ))}
                </ul>

                <PricingButton plan={plan.slug} interval={billing} featured>
                  {billing === "annual" ? `Get Started — $${plan.annualPrice.toLocaleString()}/yr` : `Get Started — $${plan.monthlyPrice}/mo`}
                </PricingButton>
              </div>
            ) : (
              <div key={plan.slug} className="relative flex flex-col rounded-sm border border-cream-border bg-cream p-8">
                {billing === "annual" && (
                  <div className="absolute -top-3.5 left-8">
                    <span className="rounded-sm bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tobacco">
                      Save ${plan.annualSavings}
                    </span>
                  </div>
                )}

                <div className="mb-6 pt-2">
                  <h3 className="font-display text-lg font-semibold text-tobacco">{plan.name}</h3>
                  <p className="mt-1 text-sm text-tobacco-light">{plan.tagline}</p>
                </div>

                <div className="mb-8 border-b border-cream-border pb-8">
                  {billing === "annual" ? (
                    <>
                      <div className="flex items-end gap-1.5">
                        <span className="font-display text-5xl font-bold text-tobacco leading-none">${plan.annualPrice.toLocaleString()}</span>
                        <span className="mb-1 text-sm text-tobacco-light">/ year</span>
                      </div>
                      <p className="mt-2 text-sm text-tobacco-light">
                        ${Math.round(plan.annualPrice / 12)}/mo equivalent · save ${plan.annualSavings}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-end gap-1.5">
                        <span className="font-display text-5xl font-bold text-tobacco leading-none">${plan.monthlyPrice}</span>
                        <span className="mb-1 text-sm text-tobacco-light">/ month</span>
                      </div>
                      <p className="mt-2 text-sm text-tobacco-light">12-month commitment · billed monthly</p>
                    </>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-sand">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-tobacco-mid">{f}</span>
                    </li>
                  ))}
                </ul>

                <PricingButton plan={plan.slug} interval={billing}>
                  {billing === "annual" ? `Get Started — $${plan.annualPrice.toLocaleString()}/yr` : `Get Started — $${plan.monthlyPrice}/mo`}
                </PricingButton>
              </div>
            )
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-tobacco-light">
          14-day free trial on all plans · Card required · Cancel annual plan before day 15 for a full refund
        </p>

      </div>
    </section>
  )
}
