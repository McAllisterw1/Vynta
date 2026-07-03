import { getPlan, type PlanKey } from '@/lib/plans'

const statusLabel: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past Due',
  canceled: 'Canceled',
}

const statusDot: Record<string, string> = {
  active: 'bg-teal',
  trialing: 'bg-sand',
  past_due: 'bg-red-400',
  canceled: 'bg-red-400',
}

interface Props {
  plan: string | null
  subscriptionStatus: string | null
}

export default function PlanBanner({ plan, subscriptionStatus }: Props) {
  const planData = getPlan(plan)

  if (!planData) {
    return (
      <div className="mb-8 flex items-center justify-between rounded-sm border border-cream-border bg-sand-pale px-5 py-3.5">
        <p className="text-sm text-tobacco-mid">
          You don&apos;t have an active plan.
        </p>
        <a
          href="/#pricing"
          className="text-sm font-medium text-teal transition-colors hover:text-teal-dark border-b border-teal/40 pb-px"
        >
          View plans →
        </a>
      </div>
    )
  }

  const status = subscriptionStatus ?? 'active'
  const limit = planData.monthlyRequestLimit

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-sm border border-cream-border bg-sand-pale px-5 py-3.5">
      <div className="flex flex-wrap items-center gap-4">
        {/* Plan badge */}
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-cream border border-cream-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-tobacco">
          {planData.name} Plan
        </span>

        {/* Status */}
        <span className="flex items-center gap-1.5 text-sm text-tobacco-mid">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot[status] ?? 'bg-tobacco-light'}`} />
          {statusLabel[status] ?? status}
        </span>

        {/* Divider */}
        <span className="hidden h-3.5 w-px bg-cream-border sm:block" />

        {/* Limit info */}
        <span className="text-sm text-tobacco-light">
          {limit === null
            ? 'Unlimited AI responses'
            : `${limit.toLocaleString()} AI responses / mo`}
        </span>

        {planData.maxLocations !== null && (
          <span className="text-sm text-tobacco-light">
            {planData.maxLocations === 1 ? '1 location' : `Up to ${planData.maxLocations} locations`}
          </span>
        )}
      </div>

      {/* Upgrade CTA — only on Starter */}
      {(plan as PlanKey) === 'starter' && (
        <a
          href="/#pricing"
          className="text-sm font-medium text-teal transition-colors hover:text-teal-dark border-b border-teal/40 pb-px whitespace-nowrap"
        >
          Upgrade to Professional →
        </a>
      )}
    </div>
  )
}
