"use client";

import { useState } from "react";
import { useResponseHistory, type HistoryEntry } from "@/lib/useResponseHistory";

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

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(entry.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-sm border border-cream-border bg-cream">
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sand-pale border border-cream-border">
                <span className="font-display text-sm font-semibold text-tobacco-mid">
                  {entry.reviewerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-tobacco leading-none mb-1">{entry.reviewerName}</p>
                <p className="text-xs text-tobacco-light">{formatDate(entry.createdAt)}</p>
              </div>
              {entry.businessName && (
                <span className="inline-flex items-center rounded-sm border border-cream-border bg-sand-pale px-2 py-0.5 text-xs text-tobacco-light">
                  {entry.businessName}
                </span>
              )}
            </div>

            <Stars rating={entry.rating} />
            <p className="mt-3 text-sm leading-relaxed text-tobacco-mid line-clamp-3">{entry.comment}</p>
          </div>

          <div className="shrink-0 sm:pl-6">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-teal px-4 py-2 text-xs font-medium text-teal transition-colors hover:bg-teal hover:text-cream"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.077 2.02a.4.4 0 0 0 .274.2l2.29.307a.4.4 0 0 1 .224.69l-1.657 1.56a.4.4 0 0 0-.115.354l.391 2.204a.4.4 0 0 1-.587.418L8 7.842l-2.14 1.007a.4.4 0 0 1-.587-.418l.391-2.204a.4.4 0 0 0-.115-.353L3.792 4.314a.4.4 0 0 1 .224-.69l2.29-.307a.4.4 0 0 0 .274-.2l1.077-2.04Z" />
              </svg>
              {expanded ? "Hide Response" : "Show Response"}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-cream-border bg-sand-pale px-6 py-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
            AI Draft Response
          </p>
          <p className="text-sm leading-relaxed text-tobacco-mid">{entry.response}</p>
          <div className="mt-3">
            <button
              onClick={handleCopy}
              className="rounded-sm bg-teal px-4 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-teal-dark cursor-pointer"
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecentReviews() {
  const { history } = useResponseHistory();

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-teal" />
          <h2 className="font-display text-xl font-semibold text-tobacco">Response History</h2>
        </div>
        {history.length > 0 && (
          <span className="text-xs text-tobacco-light">
            {history.length} response{history.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-sm border border-cream-border bg-cream px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sand-pale border border-cream-border">
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-tobacco-light">
              <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-tobacco">No responses yet</p>
          <p className="mt-1 text-xs text-tobacco-light">
            Use the Vynta AI Responder above to generate your first response.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
