"use client";

import { useState, useEffect } from "react";
import { useResponseHistory, type HistoryEntry } from "@/lib/useResponseHistory";
import { useMonthlyUsage } from "@/lib/useMonthlyUsage";
import { getPlan } from "@/lib/plans";

const CARD: React.CSSProperties = {
  background: "#E8DCC8",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
};

const FIELD: React.CSSProperties = {
  background: "white",
  borderRadius: "10px",
  border: "none",
  boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
  padding: "12px 16px",
  fontSize: "14px",
  color: "#2C1A0E",
  width: "100%",
};

const TONES = [
  { value: "professional", emoji: "💼", name: "Professional" },
  { value: "friendly",     emoji: "😊", name: "Friendly" },
  { value: "apologetic",   emoji: "🙏", name: "Apologetic" },
  { value: "savage",       emoji: "🔥", name: "Savage" },
  { value: "hypeman",      emoji: "🎉", name: "Hype Man" },
  { value: "unbothered",   emoji: "😎", name: "Unbothered" },
  { value: "storyteller",  emoji: "📖", name: "Storyteller" },
  { value: "bythenumbers", emoji: "📊", name: "By The Numbers" },
  { value: "neighbor",     emoji: "🤝", name: "Neighbor" },
  { value: "corporate",    emoji: "🏢", name: "Corporate" },
] as const;

type Tone = typeof TONES[number]["value"];

function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-3 w-3" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 16 16" className={`${sz} ${s <= rating ? "text-[#C4874A]" : "text-[#E8DDD0]"}`} fill="currentColor">
          <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CompactReviewCard({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ borderTop: "1px solid rgba(44,26,14,0.06)" }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 20px", textAlign: "left", cursor: "pointer", background: "none", border: "none" }}
      >
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#C4874A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>
            {entry.reviewerName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E" }}>{entry.reviewerName}</span>
            <Stars rating={entry.rating} size="sm" />
            <span style={{ marginLeft: "auto", fontSize: "10px", color: "#A0856A", flexShrink: 0 }}>{formatDate(entry.createdAt)}</span>
          </div>
          <p style={{ fontSize: "12px", color: "#A0856A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
            {entry.comment}
          </p>
        </div>
        <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px", color: "#A0856A", flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }}>
          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {expanded && (
        <div style={{ padding: "0 20px 16px 66px" }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "12px 16px", boxShadow: "0 1px 4px rgba(44,26,14,0.08)" }}>
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#5C3A1E" }}>{entry.response}</p>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(entry.response); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: "10px", background: "#2D9B8A", color: "white", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  plan: string | null;
  subscriptionStatus: string | null;
}

export default function HomeScreen({ plan, subscriptionStatus }: Props) {
  const { history, addEntry } = useResponseHistory();
  const { count, limit, increment, atLimit } = useMonthlyUsage(plan);

  const [requestsSent, setRequestsSent] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [ourReviewCount, setOurReviewCount] = useState<number | null>(null);
  const [ourAvgRating, setOurAvgRating] = useState<number | null>(null);

  useEffect(() => {
    try {
      const biz = localStorage.getItem("vynta_default_business");
      if (biz) setBusinessName(biz);
      const req = localStorage.getItem("vynta_requests_sent");
      if (req) setRequestsSent(parseInt(req, 10) || 0);
      const stats = localStorage.getItem("vynta_stats");
      if (stats) {
        const parsed = JSON.parse(stats) as { totalReviews?: number; avgRating?: number | null };
        if (typeof parsed.totalReviews === "number") setOurReviewCount(parsed.totalReviews);
        if (parsed.avgRating != null) setOurAvgRating(parsed.avgRating);
      }
    } catch {}
  }, []);

  const planData = getPlan(plan);
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  const canSubmit = businessName.trim().length > 0 && reviewerName.trim().length > 0 && comment.trim().length > 0;

  async function fetchDraft() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/draft-response", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), reviewerName: reviewerName.trim(), rating, comment: comment.trim(), tone }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Request failed");
      }
      const j = (await res.json()) as { response: string };
      setResponse(j.response);
      if (tone !== "savage") increment();
      addEntry({ businessName: businessName.trim(), reviewerName: reviewerName.trim(), rating, comment: comment.trim(), response: j.response });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const usageLabel = limit === null ? "Unlimited" : `${count}/${limit} this month`;

  const statCards = [
    { label: "Total Reviews", value: ourReviewCount !== null ? String(ourReviewCount) : "—", icon: "⭐" },
    { label: "Avg Rating", value: ourAvgRating !== null ? String(ourAvgRating) : "—", icon: "📊" },
    { label: "Responses Used", value: String(history.length), icon: "💬" },
    { label: "Requests Sent", value: String(requestsSent), icon: "✉️" },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>

      {/* Sticky top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "#FAF5E8", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg viewBox="0 0 62 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: "20px", width: "auto" }}>
            <path d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
              stroke="#C4874A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="5"  cy="3" r="2" fill="#C4874A" />
            <circle cx="17" cy="3" r="2" fill="#C4874A" />
            <circle cx="29" cy="3" r="2" fill="#C4874A" />
            <circle cx="41" cy="3" r="2" fill="#C4874A" />
            <circle cx="53" cy="3" r="2" fill="#C4874A" />
          </svg>
          <span className="font-display" style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2C1A0E" }}>
            Vynta
          </span>
        </div>
        {planData && isActive ? (
          <span style={{ background: "#E8DCC8", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600, color: "#C4874A", textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: "0 1px 4px rgba(44,26,14,0.1)" }}>
            {planData.name}
          </span>
        ) : (
          <a href="/#pricing" style={{ fontSize: "12px", fontWeight: 600, color: "#2D9B8A" }}>Get a plan →</a>
        )}
      </header>

      {/* Scrollable content */}
      <div style={{ padding: "24px 24px 120px" }}>

        {/* Stat cards — 2×2 mobile, 4-col desktop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }} className="sm:grid-cols-4">
          {statCards.map(({ label, value, icon }) => (
            <div key={label} style={{ ...CARD, padding: "16px" }}>
              <div style={{ fontSize: "22px", marginBottom: "8px" }}>{icon}</div>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "6px" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* AI Review Responder */}
        <div style={{ ...CARD, padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E" }}>
              AI Review Responder
            </h2>
            <span style={{ fontSize: "10px", color: "#A0856A" }}>{usageLabel}</span>
          </div>

          {/* Business + Stars */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business name"
              style={{ ...FIELD, flex: 1, width: "auto" }}
              className="focus:outline-none focus:ring-2 focus:ring-[#C4874A]/30"
            />
            <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                  <svg viewBox="0 0 16 16" style={{ width: "20px", height: "20px", color: s <= rating ? "#C4874A" : "#E8DDD0" }} fill="currentColor">
                    <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Reviewer's name"
            style={{ ...FIELD, marginBottom: "10px" }}
            className="focus:outline-none focus:ring-2 focus:ring-[#C4874A]/30"
          />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Paste the customer's review here…"
            style={{ ...FIELD, resize: "none", marginBottom: "12px" }}
            className="focus:outline-none focus:ring-2 focus:ring-[#C4874A]/30"
          />

          {/* Tone pills */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "14px", scrollbarWidth: "none" } as React.CSSProperties}>
            {TONES.map(({ value, emoji, name }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTone(value)}
                style={{
                  flexShrink: 0,
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 500,
                  background: tone === value ? "#2C1A0E" : "#E8DCC8",
                  color: tone === value ? "white" : "#A0856A",
                  border: "none",
                  boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
                  cursor: "pointer",
                  transition: "background 150ms, color 150ms",
                }}
              >
                {emoji} {name}
              </button>
            ))}
          </div>

          {/* Generate */}
          <button
            type="button"
            onClick={() => { setResponse(""); fetchDraft(); }}
            disabled={!canSubmit || loading}
            style={{
              width: "100%",
              background: canSubmit && !loading ? "#2C1A0E" : "#A0856A",
              color: "white",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: canSubmit && !loading ? "pointer" : "not-allowed",
              opacity: canSubmit && !loading ? 1 : 0.6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 150ms, opacity 150ms",
            }}
          >
            {loading && !response ? (
              <>
                <svg style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                </svg>
                Generating…
              </>
            ) : "Generate AI Response"}
          </button>

          {atLimit && <p style={{ marginTop: "12px", fontSize: "12px", color: "#D97706" }}>Monthly limit reached. <a href="/#pricing" style={{ textDecoration: "underline" }}>Upgrade</a> for more.</p>}
          {error && <p style={{ marginTop: "12px", fontSize: "12px", color: "#EF4444" }}>{error}</p>}

          {response && (
            <div style={{ marginTop: "14px", background: "white", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 4px rgba(44,26,14,0.08)" }}>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "8px" }}>Draft Response</p>
              {loading ? (
                <p style={{ fontSize: "13px", color: "#A0856A" }}>Regenerating…</p>
              ) : (
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#5C3A1E" }}>{response}</p>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  disabled={loading}
                  style={{ background: "#2D9B8A", color: "white", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={fetchDraft}
                  disabled={loading || (atLimit && tone !== "savage")}
                  style={{ background: "white", color: "#A0856A", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 500, border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", cursor: "pointer" }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Response History */}
        {history.length > 0 && (
          <div style={{ ...CARD, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px" }}>
              <h3 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, color: "#2C1A0E" }}>Response History</h3>
              <span style={{ fontSize: "10px", color: "#A0856A" }}>{history.length} total</span>
            </div>
            {history.slice(0, 10).map((entry) => (
              <CompactReviewCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
