"use client";

import { useState } from "react";

export default function SendReviewRequest() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1000);
  }

  function handleReset() {
    setName("");
    setContact("");
    setSent(false);
  }

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px w-8 bg-teal" />
        <h2 className="font-display text-xl font-semibold text-tobacco">Send Review Request</h2>
      </div>

      <div className="rounded-sm border border-cream-border bg-cream p-6">
        {sent ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {/* Checkmark icon */}
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
              {/* Name field */}
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
                  className="w-full rounded-sm border border-cream-border bg-sand-pale px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal"
                />
              </div>

              {/* Phone / Email field */}
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
                  className="w-full rounded-sm border border-cream-border bg-sand-pale px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal"
                />
              </div>

              {/* Submit button */}
              <div className="shrink-0">
                <button
                  type="submit"
                  disabled={sending || !name.trim() || !contact.trim()}
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
                        <path d="M1.5 1.5a.5.5 0 0 1 .64-.48l12 4a.5.5 0 0 1 0 .96l-5.17 1.72-1.72 5.17a.5.5 0 0 1-.96 0l-4-12A.5.5 0 0 1 1.5 1.5Zm1.56 1.56 3.13 9.38 1.34-4.02a.5.5 0 0 1 .32-.32l4.02-1.34-8.81-3.7Z"/>
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
