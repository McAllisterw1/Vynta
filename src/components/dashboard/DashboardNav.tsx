import { getPlan } from '@/lib/plans'

const planBadgeStyle: Record<string, string> = {
  starter: 'bg-sand-pale text-tobacco-mid border-sand/50',
  growth:  'bg-teal/10 text-teal border-teal/30',
  agency:  'bg-tobacco/10 text-tobacco border-tobacco/20',
}

interface Props {
  userName: string
  plan: string | null
  subscriptionStatus: string | null
}

export default function DashboardNav({ userName, plan, subscriptionStatus }: Props) {
  const planData = getPlan(plan)
  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'

  return (
    <header className="bg-cream border-b border-cream-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 62 19" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto">
            <path
              d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
              stroke="#C4874A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
            <circle cx="5"  cy="3" r="2" fill="#C4874A" />
            <circle cx="17" cy="3" r="2" fill="#C4874A" />
            <circle cx="29" cy="3" r="2" fill="#C4874A" />
            <circle cx="41" cy="3" r="2" fill="#C4874A" />
            <circle cx="53" cy="3" r="2" fill="#C4874A" />
          </svg>
          <span className="font-display font-bold text-sm uppercase" style={{ color: "#2C1A0E", letterSpacing: "0.12em" }}>
            Vynta
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Plan badge */}
          {planData && isActive && (
            <span className={`hidden sm:inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${planBadgeStyle[plan!] ?? 'bg-sand-pale text-tobacco-mid border-cream-border'}`}>
              {planData.name}
            </span>
          )}

          {/* User greeting */}
          <p className="hidden text-sm text-tobacco-light md:block">
            Welcome back,{' '}
            <span className="font-medium text-tobacco">{userName}</span>
          </p>

          <a
            href="/"
            className="rounded border border-cream-border px-4 py-1.5 text-sm text-tobacco-light transition-colors hover:border-tobacco-light hover:text-tobacco"
          >
            Log out
          </a>
        </div>

      </div>
    </header>
  )
}
