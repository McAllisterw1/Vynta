"use client";

import { useState } from "react";

export default function AIReviewResponder() {
  const [businessName, setBusinessName] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const canSubmit = businessName.trim() !== "" && reviewerName.trim() !== "" && rating > 0 && comment.trim() !== "";

  async function fetchDraft() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/draft-response", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          reviewerName: reviewerName.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Request failed");
      }
      const json = await res.json() as { response: string };
      setResponse(json.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate() {
    if (!canSubmit || loading) return;
    setResponse("");
    fetchDraft();
  }

  function handleRegenerate() {
    if (loading) return;
    fetchDraft();
  }

  function handleCopy() {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px w-8 bg-teal" />
        <h2 className="font-display text-xl font-semibold text-tobacco">AI Review Responder</h2>
      </div>

      <div className="rounded-sm border border-cream-border bg-cream p-6">
        <p className="mb-5 text-sm text-tobacco-light">
          Paste a customer review and get a professional, human-sounding response in seconds.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Marcus's Barbershop"
                className="w-full rounded-sm border border-cream-border bg-sand-pale px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
                Reviewer's Name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. James T."
                className="w-full rounded-sm border border-cream-border bg-sand-pale px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
              Star Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="cursor-pointer"
                  aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                >
                  <svg
                    viewBox="0 0 16 16"
                    className={`h-6 w-6 ${star <= rating ? "text-sand-dark" : "text-cream-border"}`}
                    fill="currentColor"
                  >
                    <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-xs text-tobacco-light">{rating} star{rating !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
              Customer Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Paste the customer's review here…"
              className="w-full rounded-sm border border-cream-border bg-sand-pale px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal resize-none"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canSubmit || loading}
              className="flex cursor-pointer items-center gap-2 rounded-sm bg-teal px-6 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && response === "" ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                  </svg>
                  Generating…
                </>
              ) : (
                "Generate AI Response"
              )}
            </button>
          </div>
        </div>

        {error !== "" && (
          <div className="mt-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {response !== "" && (
          <div className="mt-5 border-t border-cream-border pt-5">
            <div className="rounded-sm border border-cream-border bg-sand-pale px-5 py-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-tobacco-light">
                AI Draft Response
              </p>
              {loading ? (
                <div className="flex items-center gap-2 py-1 text-tobacco-light">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                  </svg>
                  <span className="text-sm">Regenerating…</span>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-tobacco-mid">{response}</p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={loading}
                  className="flex cursor-pointer items-center gap-1.5 rounded-sm bg-teal px-4 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? "Copied!" : "Copy to clipboard"}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="cursor-pointer rounded-sm border border-cream-border px-4 py-1.5 text-xs font-medium text-tobacco-light transition-colors hover:border-tobacco-light hover:text-tobacco disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Regenerating…" : "Regenerate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
