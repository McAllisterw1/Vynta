"use client";

import { useState } from "react";
import { getPlan } from "@/lib/plans";

interface Props {
  plan: string | null
  requestsUsed?: number
}

export default function SendReviewRequest({ plan, requestsUsed = 14 }: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const planData = getPlan(plan)
  const limit = planData?.monthlyRequestLimit ?? null
  const atLimit = limit !== null && requestsUsed >= limit

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || atLimit) return;
    setSending(true);
    setTimeout(() => {
      fetch("/api/user/usage", { method: "POST" }).catch(() => {});
      setSending(false);
      setSent(true);
    }, 1000);
  }

  function handleReset() {
    setName(""); setContact(""); setSent(false);
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px w-8 bg-teal" />
        <h2 className="font-display text-xl font-semibold text-tobacco">Send Review Request</h2>
      </div>

      <div className="rounded-sm border border-cream-border bg-cream p-6">

        {/* Usage bar — Starter only */}
        {limit !== null && (
          <div className="mb-5 pb-5 border-b border-cream-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
                Monthly Requests
              </span>
              <span className={`text-xs font-semibold ${atLimit ? 'text-red-500' : 'text-tobacco-mid'}`}>
                {requestsUsed.toLocaleString()} / {limit.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-cream-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-400' : 'bg-teal'}`}
                style={{ width: `${Math.min((requestsUsed / limit) * 100, 100)}%` }}
              />
            </div>
            {atLimit && (
              <p className="mt-2 text-xs text-red-500">
                Monthly limit reached.{' '}
                <a href="/#pricing" className="underline hover:text-red-600">Upgrade to Growth</a>
                {' '}for unlimited requests.
              </p>
            )}
          </div>
        )}

        {/* Unlimited badge — Growth / Agency */}
        {limit === null && planData && (
          <div className="mb-5 pb-5 border-b border-cream-border flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-teal/10 border border-teal/20 px-2.5 py-1 text-xs font-medium text-teal">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              Unlimited requests this month
            </span>
          </div>
        )}

        {sent ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 border border-teal/20">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-teal" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8.5l3.5 3.5 6.5-7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-tobacco">Request sent to {name}!</p>
                <p className="mt-0.5 text-xs text-tobacco-light">
                  They&apos;ll receive a friendly, personalized message asking them to share their experience.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 rounded-sm border border-cream-border px-4 py-1.5 text-xs font-medium text-tobacco-light transition-colors hover:border-tobacco-light hover:text-tobacco cursor-pointer"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus J."
                  required
                  disabled={atLimit}
                  className="w-full rounded-sm border border-cream-border bg-sand-pale px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
                  Phone or Email
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. (555) 000-1234 or hello@email.com"
                  required
                  disabled={atLimit}
                  className="w-full rounded-sm border border-cream-border bg-sand-pale px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="shrink-0">
                <button
                  type="submit"
                  disabled={sending || !name.trim() || !contact.trim() || atLimit}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-teal px-6 py-2 text-sm font-medium text-cream transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {sending ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M1.5 1.5a.5.5 0 0 1 .64-.48l12 4a.5.5 0 0 1 0 .96l-5.17 1.72-1.72 5.17a.5.5 0 0 1-.96 0l-4-12A.5.5 0 0 1 1.5 1.5Zm1.56 1.56 3.13 9.38 1.34-4.02a.5.5 0 0 1 .32-.32l4.02-1.34-8.81-3.7Z" />
                      </svg>
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-tobacco-light">
              Your customer will receive a friendly personalized message asking them to share their experience.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
