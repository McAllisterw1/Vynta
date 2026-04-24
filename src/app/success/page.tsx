import Link from 'next/link'

export const metadata = { title: 'You\'re in — Vynta' }

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-teal">
          <path d="M4.5 12.75l6 6 9-13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="font-display text-3xl font-bold text-tobacco mb-3">You're all set.</h1>
      <p className="text-tobacco-light max-w-sm leading-relaxed mb-8">
        Your subscription is active. Head to your dashboard to start collecting reviews.
      </p>

      <Link
        href="/dashboard"
        className="rounded bg-teal px-8 py-3 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
