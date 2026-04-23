"use client";

import { useState } from "react";

const reviews = [
  {
    id: 1,
    name: "James T.",
    rating: 5,
    date: "2 days ago",
    comment:
      "Best barbershop in town — hands down. Always on time, the atmosphere is warm and relaxed, and my cut comes out perfect every single time. My go-to spot for years.",
    draftResponse:
      "James, this genuinely made our day — thank you! Years of loyalty means everything to us, and we're so glad the experience keeps delivering. See you at your next appointment!",
  },
  {
    id: 2,
    name: "Maria K.",
    rating: 4,
    date: "5 days ago",
    comment:
      "Really lovely experience overall. The staff is friendly and the space feels genuinely welcoming. Wait was a little longer than expected, but the quality of the cut made it worth it.",
    draftResponse:
      "Thank you so much, Maria — we're really glad you felt at home here. You're absolutely right about the wait, and we're actively working on tightening up our scheduling so your time is always respected. We'd love to earn that fifth star next time!",
  },
  {
    id: 3,
    name: "David R.",
    rating: 3,
    date: "1 week ago",
    comment:
      "Decent cut and friendly enough staff, but I waited almost 30 minutes past my appointment time. The work itself was solid — would appreciate tighter scheduling.",
    draftResponse:
      "David, thank you for the honest feedback — a 30-minute wait past your appointment time is not okay, and we're sorry for that. We've been reviewing our booking flow this week and are making changes to keep things running on schedule. We'd love another chance to give you the experience you deserved from the start.",
  },
];

type ReviewState = {
  loading: boolean;
  regenerating: boolean;
  response: string | null;
  expanded: boolean;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          className={`h-3.5 w-3.5 ${i < rating ? "text-sand-dark" : "text-cream-border"}`}
          fill="currentColor"
        >
          <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-cream-border bg-cream px-2 py-0.5 text-xs font-medium text-tobacco-light">
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
        <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.51-1.39 2.4-3.44 2.4-5.88Z" fill="#4285F4"/>
        <path d="M8 16c2.16 0 3.97-.71 5.29-1.94l-2.58-2a4.8 4.8 0 0 1-7.15-2.52H.9v2.07A8 8 0 0 0 8 16Z" fill="#34A853"/>
        <path d="M3.56 9.54A4.83 4.83 0 0 1 3.3 8c0-.54.09-1.06.25-1.54V4.39H.9A8.01 8.01 0 0 0 0 8c0 1.29.31 2.51.9 3.61l2.66-2.07Z" fill="#FBBC05"/>
        <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A7.94 7.94 0 0 0 8 0 8 8 0 0 0 .9 4.39l2.66 2.07A4.77 4.77 0 0 1 8 3.18Z" fill="#EA4335"/>
      </svg>
      Google
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  );
}

export default function RecentReviews() {
  const [states, setStates] = useState<Record<number, ReviewState>>({});

  function getState(id: number): ReviewState {
    return states[id] ?? { loading: false, regenerating: false, response: null, expanded: false };
  }

  function setState(id: number, patch: Partial<ReviewState>) {
    setStates((prev) => ({
      ...prev,
      [id]: { ...getState(id), ...patch },
    }));
  }

  function handleDraft(review: typeof reviews[number]) {
    const current = getState(review.id);
    if (current.response) {
      setState(review.id, { expanded: !current.expanded });
      return;
    }

    setState(review.id, { loading: true });

    setTimeout(() => {
      setState(review.id, { loading: false, response: review.draftResponse, expanded: true });
    }, 1500);
  }

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-teal" />
          <h2 className="font-display text-xl font-semibold text-tobacco">Recent Reviews</h2>
        </div>
        <a
          href="#"
          className="text-sm text-teal transition-colors hover:text-teal-dark border-b border-teal/40 pb-px"
        >
          View all
        </a>
      </div>

      {/* Review cards */}
      <div className="flex flex-col gap-4">
        {reviews.map((review) => {
          const state = getState(review.id);
          return (
            <div key={review.id} className="rounded-sm border border-cream-border bg-cream">
              <div className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  {/* Left: review content */}
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sand-pale border border-cream-border">
                        <span className="font-display text-sm font-semibold text-tobacco-mid">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-tobacco leading-none mb-1">{review.name}</p>
                        <p className="text-xs text-tobacco-light">{review.date}</p>
                      </div>
                      <GoogleBadge />
                    </div>

                    <Stars rating={review.rating} />

                    <p className="mt-3 text-sm leading-relaxed text-tobacco-mid">{review.comment}</p>
                  </div>

                  {/* Right: AI Response button */}
                  <div className="shrink-0 sm:pl-6">
                    <button
                      onClick={() => handleDraft(review)}
                      disabled={state.loading}
                      className="flex cursor-pointer items-center gap-2 rounded-sm border border-teal px-4 py-2 text-xs font-medium text-teal transition-colors hover:bg-teal hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {state.loading ? (
                        <Spinner />
                      ) : (
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.077 2.02a.4.4 0 0 0 .274.2l2.29.307a.4.4 0 0 1 .224.69l-1.657 1.56a.4.4 0 0 0-.115.354l.391 2.204a.4.4 0 0 1-.587.418L8 7.842l-2.14 1.007a.4.4 0 0 1-.587-.418l.391-2.204a.4.4 0 0 0-.115-.353L3.792 4.314a.4.4 0 0 1 .224-.69l2.29-.307a.4.4 0 0 0 .274-.2l1.077-2.04Z"/>
                          <path d="M12.828 8.586a.3.3 0 0 1 .514 0l.647 1.212a.3.3 0 0 0 .206.15l1.374.184a.3.3 0 0 1 .168.518l-.994.936a.3.3 0 0 0-.086.265l.235 1.323a.3.3 0 0 1-.44.314L13.085 12.7a.3.3 0 0 0-.28 0l-1.367.598a.3.3 0 0 1-.44-.314l.234-1.323a.3.3 0 0 0-.086-.265l-.994-.936a.3.3 0 0 1 .168-.518l1.374-.184a.3.3 0 0 0 .206-.15l.928-1.022Z" opacity=".6"/>
                        </svg>
                      )}
                      {state.loading
                        ? "Drafting…"
                        : state.response
                        ? state.expanded ? "Hide Response" : "Show Response"
                        : "Draft AI Response"}
                    </button>
                  </div>

                </div>
              </div>

              {/* Expandable AI response */}
              {state.expanded && (state.response || state.regenerating) && (
                <div className="border-t border-cream-border bg-sand-pale px-6 py-4">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
                    AI Draft Response
                  </p>
                  {state.regenerating ? (
                    <div className="flex min-h-[3.5rem] items-center gap-2 text-tobacco-light">
                      <Spinner />
                      <span className="text-sm">Regenerating response…</span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-tobacco-mid">{state.response}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(state.response!)}
                      disabled={state.regenerating}
                      className="rounded-sm bg-teal px-4 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-teal-dark cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Copy to clipboard
                    </button>
                    <button
                      onClick={() => {
                        setState(review.id, { regenerating: true, response: null });
                        setTimeout(() => {
                          setState(review.id, { regenerating: false, response: review.draftResponse });
                        }, 1500);
                      }}
                      disabled={state.regenerating}
                      className="rounded-sm border border-cream-border px-4 py-1.5 text-xs font-medium text-tobacco-light transition-colors hover:border-tobacco-light hover:text-tobacco cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
