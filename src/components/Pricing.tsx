import PricingButton from './PricingButton'

type MonthlyPlan = {
  slug: string
  name: string
  billing: 'monthly'
  price: number
  tagline: string
  features: string[]
  cta: string
  featured: boolean
}

type YearlyPlan = {
  slug: string
  name: string
  billing: 'yearly'
  yearlyPrice: number
  monthlyEquiv: number
  savingsAmount: number
  tagline: string
  features: string[]
  cta: string
  featured: boolean
}

type Plan = MonthlyPlan | YearlyPlan

const plans: Plan[] = [
  {
    slug: 'starter',
    name: 'Vynta Starter',
    billing: 'monthly',
    price: 49,
    tagline: 'Everything a local business needs to start managing reviews.',
    features: [
      'Review logging & management',
      'AI review responder — 3 tones',
      'Basic analytics & charts',
      'Basic review tracking',
      'Up to 20 AI responses/month',
      'Cancel anytime',
    ],
    cta: 'Start for $49/month',
    featured: false,
  },
  {
    slug: 'professional',
    name: 'Professional',
    billing: 'yearly',
    yearlyPrice: 990,
    monthlyEquiv: 83,
    savingsAmount: 198,
    tagline: 'The complete reputation system for serious local businesses.',
    features: [
      'Everything in Starter',
      'SMS & email review request campaigns',
      'All 10 AI response tones',
      'Recovery mode for negative reviews',
      'Google review score predictor',
      'AI review consultant',
      'Review training modules',
      'Monthly reputation report',
      'Up to 150 AI responses/month',
      'Priority support',
    ],
    cta: 'Get Started',
    featured: true,
  },
  {
    slug: 'agency',
    name: 'Agency',
    billing: 'yearly',
    yearlyPrice: 1990,
    monthlyEquiv: 166,
    savingsAmount: 398,
    tagline: 'For agencies, franchises, and multi-location businesses.',
    features: [
      'Everything in Professional',
      'Multi-client / multi-location dashboard',
      'Competitor tracking & comparison',
      'AI-powered competitor insights',
      'Goals & AI next-move recommendations',
      'Automated monthly reputation reports',
      'Weekly reputation reports',
      'White-label reporting',
      'Advanced usage controls',
      'Up to 1,000 AI responses/month',
      'Dedicated account manager',
    ],
    cta: 'Get Started',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="bg-cream py-28">
      <div className="mx-auto max-w-6xl px-6">

        {/* Section header */}
        <div className="mb-16 flex flex-col gap-3 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">Pricing</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-tobacco leading-tight md:text-5xl">
            Simple pricing for{" "}
            <em style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #2D9B8A 0%, #4F46E5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>growing local businesses</em>
          </h2>
          <p className="text-tobacco-light leading-relaxed">
            No hidden fees. Starter is month-to-month. Professional and Agency billed annually — 2 months free.
          </p>
          <p className="text-sm font-medium text-teal">
            Step into the mission control room for your online business reputation.
          </p>
        </div>

        {/* Plans */}
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan) =>
            plan.featured ? (
              /* ── Featured (Starter) ── */
              <div
                key={plan.name}
                className="relative flex flex-col rounded-sm bg-tobacco p-8 shadow-xl"
              >
                <div className="absolute -top-3.5 left-8">
                  <span className="rounded-sm bg-teal px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream">
                    Most Popular
                  </span>
                </div>

                <div className="mb-6 pt-2">
                  <h3 className="font-display text-lg font-semibold text-cream">{plan.name}</h3>
                  <p className="mt-1 text-sm text-sand-light/70">{plan.tagline}</p>
                </div>

                {plan.billing === 'yearly' ? (
                  <div className="mb-8 border-b border-tobacco-mid pb-8">
                    <div className="flex items-end gap-1.5">
                      <span className="font-display text-5xl font-bold text-cream leading-none">
                        ${(plan as YearlyPlan).yearlyPrice.toLocaleString()}
                      </span>
                      <span className="mb-1 text-sm text-sand-light/60">/ year</span>
                    </div>
                    <p className="mt-2 text-sm text-sand-light/60">
                      just ${(plan as YearlyPlan).monthlyEquiv}/mo · save ${(plan as YearlyPlan).savingsAmount}
                    </p>
                  </div>
                ) : (
                  <div className="mb-8 flex items-end gap-1.5 border-b border-tobacco-mid pb-8">
                    <span className="font-display text-5xl font-bold text-cream leading-none">
                      ${(plan as MonthlyPlan).price}
                    </span>
                    <span className="mb-1 text-sm text-sand-light/60">/ month</span>
                  </div>
                )}

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-teal-light">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-sand-light/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <PricingButton featured>{plan.cta}</PricingButton>
              </div>
            ) : (
              /* ── Non-featured (Professional, Agency) — yearly billing ── */
              <div
                key={plan.name}
                className="relative flex flex-col rounded-sm border border-cream-border bg-cream p-8"
              >
                {plan.billing === 'yearly' && (
                  <div className="absolute -top-3.5 left-8">
                    <span className="rounded-sm bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tobacco">
                      2 months free
                    </span>
                  </div>
                )}

                <div className="mb-6 pt-2">
                  <h3 className="font-display text-lg font-semibold text-tobacco">{plan.name}</h3>
                  <p className="mt-1 text-sm text-tobacco-light">{plan.tagline}</p>
                </div>

                {plan.billing === 'yearly' ? (
                  <div className="mb-8 border-b border-cream-border pb-8">
                    <div className="flex items-end gap-1.5">
                      <span className="font-display text-5xl font-bold text-tobacco leading-none">
                        ${(plan as YearlyPlan).yearlyPrice.toLocaleString()}
                      </span>
                      <span className="mb-1 text-sm text-tobacco-light">/ year</span>
                    </div>
                    <p className="mt-2 text-sm text-tobacco-light">
                      just ${(plan as YearlyPlan).monthlyEquiv}/mo · save ${(plan as YearlyPlan).savingsAmount}
                    </p>
                  </div>
                ) : (
                  <div className="mb-8 flex items-end gap-1.5 border-b border-cream-border pb-8">
                    <span className="font-display text-5xl font-bold text-tobacco leading-none">
                      ${(plan as MonthlyPlan).price}
                    </span>
                    <span className="mb-1 text-sm text-tobacco-light">/ month</span>
                  </div>
                )}

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-sand">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-tobacco-mid">{feature}</span>
                    </li>
                  ))}
                </ul>

                <PricingButton>{plan.cta}</PricingButton>
              </div>
            )
          )}
        </div>

        <p className="mt-10 text-center text-sm text-tobacco-light">
          All plans include a 14-day free trial. No credit card required.
        </p>

      </div>
    </section>
  )
}
