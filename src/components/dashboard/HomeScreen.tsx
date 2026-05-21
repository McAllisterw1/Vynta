"use client";

import { useState, useEffect } from "react";
import { useResponseHistory, type HistoryEntry } from "@/lib/useResponseHistory";
import { useMonthlyUsage } from "@/lib/useMonthlyUsage";
import { getPlan, canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";
import MarkdownContent from "@/components/ui/MarkdownContent";

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
        <svg key={s} viewBox="0 0 16 16" className={`${sz} ${s <= rating ? "text-[#C4874A]" : "text-[#C8B49A]"}`} fill="currentColor">
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

interface CrisisReview {
  id?: string;
  text?: string;
  content?: string;
  body?: string;
  rating: number;
  date?: string;
  createdAt?: string;
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
  const [tone, setTone] = useState<Tone>("professional" as Tone);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [ourReviewCount, setOurReviewCount] = useState<number | null>(null);
  const [ourAvgRating, setOurAvgRating] = useState<number | null>(null);
  const [recentNegativeReviews, setRecentNegativeReviews] = useState<CrisisReview[]>([]);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisActionPlan, setCrisisActionPlan] = useState<string | null>(null);
  const [crisisLoading, setCrisisLoading] = useState(false);
  const [crisisDismissed, setCrisisDismissed] = useState(false);

  useEffect(() => {
    try {
      const biz = localStorage.getItem("vynta_default_business");
      if (biz) setBusinessName(biz);
      const savedTone = localStorage.getItem("vynta_default_tone") as Tone | null;
      if (savedTone) setTone(savedTone);
      const req = localStorage.getItem("vynta_requests_sent");
      if (req) setRequestsSent(parseInt(req, 10) || 0);
      const stats = localStorage.getItem("vynta_stats");
      if (stats) {
        const parsed = JSON.parse(stats) as { totalReviews?: number; avgRating?: number | null };
        if (typeof parsed.totalReviews === "number") setOurReviewCount(parsed.totalReviews);
        if (parsed.avgRating != null) setOurAvgRating(parsed.avgRating);
      }

      const reviewsRaw = localStorage.getItem("vynta_our_reviews");
      if (reviewsRaw) {
        const reviews = JSON.parse(reviewsRaw) as CrisisReview[];
        const cutoff = Date.now() - 48 * 60 * 60 * 1000;
        const negatives = reviews.filter((r) => {
          const dateStr = r.date ?? r.createdAt;
          if (!dateStr) return false;
          return new Date(dateStr).getTime() >= cutoff && r.rating <= 3;
        });
        setRecentNegativeReviews(negatives);
        const detected = negatives.length >= 2;
        setCrisisDetected(detected);
        if (detected) {
          const dismissedRaw = localStorage.getItem("vynta_crisis_dismissed");
          if (dismissedRaw) {
            const { dismissedAt, reviewCount } = JSON.parse(dismissedRaw) as { dismissedAt: number; reviewCount: number };
            const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
            if (negatives.length === reviewCount && hoursSince < 24) {
              setCrisisDismissed(true);
            }
          }
        }
      }
    } catch {}
  }, []);

  const planData = getPlan(plan);
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  const canSubmit = businessName.trim().length > 0 && reviewerName.trim().length > 0 && comment.trim().length > 0;

  async function fetchCrisisActionPlan() {
    if (crisisLoading) return;
    setCrisisLoading(true);
    setCrisisActionPlan(null);
    let competitorContext = "";
    try {
      const comps = JSON.parse(localStorage.getItem("vynta_competitors") ?? "[]") as Array<{ name: string; rating: number; reviewCount: number }>;
      if (comps.length > 0) competitorContext = comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ");
    } catch {}
    const system = "You are a trusted reputation management advisor. Be direct, urgent, and practical.";
    const msg = `A local service business is experiencing a reputation crisis. They have received ${recentNegativeReviews.length} negative reviews (3 stars or below) in the last 48 hours. Here are the reviews:
${recentNegativeReviews.map((r, i) => `${i + 1}. "${r.text ?? r.content ?? r.body ?? ""}" — ${r.rating} stars`).join("\n")}
Business competitors: ${competitorContext || "None tracked"}

Generate a specific, urgent action plan for this business owner. Be direct and practical. Include:
1. What to do in the next 2 hours
2. How to respond to these specific reviews
3. What systemic issue might be causing this
4. How to prevent it from happening again

Format with clear headers and bullet points. Be a trusted advisor, not a corporate chatbot.`;
    try {
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
      });
      const data = (await res.json()) as { response?: string };
      setCrisisActionPlan(data.response?.trim() ?? "");
    } catch {
      // silently fail
    } finally {
      setCrisisLoading(false);
    }
  }

  function dismissCrisis() {
    try {
      localStorage.setItem("vynta_crisis_dismissed", JSON.stringify({
        dismissedAt: Date.now(),
        reviewCount: recentNegativeReviews.length,
      }));
    } catch {}
    setCrisisDismissed(true);
  }

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
          tone,
          competitorContext: (() => {
            try {
              const comps = JSON.parse(localStorage.getItem("vynta_competitors") || "[]") as Array<{ name: string; rating: number; reviewCount: number }>;
              return comps.length > 0 ? comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ") : "";
            } catch { return ""; }
          })(),
        }),
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
      <style>{`
        @keyframes crisis-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .crisis-md p, .crisis-md li, .crisis-md h1, .crisis-md h2, .crisis-md h3, .crisis-md h4, .crisis-md strong, .crisis-md em { color: rgba(255,255,255,0.88) !important; }
        .crisis-md ul, .crisis-md ol { padding-left: 18px; margin: 6px 0; }
        .crisis-md li { margin-bottom: 4px; }
        .crisis-md h1, .crisis-md h2, .crisis-md h3 { margin: 12px 0 4px; }
      `}</style>

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

        {/* ── Reputation Crisis Alert ── */}
        {crisisDetected && !crisisDismissed && (
          <UpgradeTooltip locked={!canAccess(plan, "crisisDetection")} requiredPlan="Agency">
          <div style={{
            background: "#1a0a0a",
            border: "1px solid #C0392B",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "16px",
          }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: "#C0392B", flexShrink: 0, display: "inline-block",
                animation: "crisis-pulse 1.5s ease-in-out infinite",
              }} />
              <p style={{ fontSize: "14px", fontWeight: 700, color: "white", margin: 0 }}>
                ⚠️ Reputation Crisis Detected
              </p>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(192,57,43,0.85)", marginBottom: "14px", paddingLeft: "20px" }}>
              {recentNegativeReviews.length} negative review{recentNegativeReviews.length !== 1 ? "s" : ""} in the last 48 hours — act now
            </p>

            {/* Review list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              {recentNegativeReviews.map((r, i) => (
                <div key={r.id ?? i} style={{ background: "rgba(192,57,43,0.1)", borderRadius: "8px", padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <Stars rating={r.rating} size="sm" />
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>{r.rating} star{r.rating !== 1 ? "s" : ""}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.78)", margin: 0, lineHeight: 1.5 }}>
                    &ldquo;{r.text ?? r.content ?? r.body ?? "(no review text)"}&rdquo;
                  </p>
                </div>
              ))}
            </div>

            {/* Action plan / button */}
            {!crisisActionPlan ? (
              <>
                <button
                  type="button"
                  onClick={fetchCrisisActionPlan}
                  disabled={crisisLoading}
                  style={{
                    width: "100%",
                    background: crisisLoading ? "rgba(192,57,43,0.55)" : "#C0392B",
                    color: "white",
                    borderRadius: "10px",
                    padding: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    border: "none",
                    cursor: crisisLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    transition: "background 150ms",
                  }}
                >
                  {crisisLoading ? (
                    <>
                      <svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                      </svg>
                      Building action plan…
                    </>
                  ) : "Get Action Plan"}
                </button>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textAlign: "center", margin: 0 }}>
                  Powered by Vynta AI
                </p>
              </>
            ) : (
              <>
                <div style={{ height: "1px", background: "rgba(192,57,43,0.25)", margin: "4px 0 14px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(192,57,43,0.85)", fontWeight: 600, margin: 0 }}>
                    Action Plan
                  </p>
                  <button
                    type="button"
                    onClick={fetchCrisisActionPlan}
                    disabled={crisisLoading}
                    aria-label="Regenerate action plan"
                    style={{ background: "none", border: "none", cursor: crisisLoading ? "not-allowed" : "pointer", color: "rgba(255,255,255,0.35)", padding: "2px", lineHeight: 0 }}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "13px", height: "13px" }}>
                      <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.75.75 0 0 1 1.36-.636A6.5 6.5 0 1 1 8 1.5v-.75a.25.25 0 0 1 .427-.177l2.25 2.25a.25.25 0 0 1 0 .354l-2.25 2.25A.25.25 0 0 1 8 5.25V3Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="crisis-md">
                  <MarkdownContent>{crisisActionPlan}</MarkdownContent>
                </div>
              </>
            )}

            {/* Dismiss */}
            <button
              type="button"
              onClick={dismissCrisis}
              style={{
                width: "100%",
                marginTop: "14px",
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
              }}
            >
              Dismiss until new reviews
            </button>
          </div>
          </UpgradeTooltip>
        )}

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
                  <svg viewBox="0 0 16 16" style={{ width: "20px", height: "20px", color: s <= rating ? "#C4874A" : "#C8B49A" }} fill="currentColor">
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
          {/* Starter: Professional, Friendly, Apologetic, Savage free. All others locked. */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "14px", scrollbarWidth: "none" } as React.CSSProperties}>
            {TONES.map(({ value, emoji, name }) => {
              const FREE_TONES = new Set(["professional", "friendly", "apologetic", "savage"]);
              const toneLocked = !canAccess(plan, "toneOptions") && !FREE_TONES.has(value);
              return (
                <UpgradeTooltip key={value} locked={toneLocked} requiredPlan="Pro">
                  <button
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
                </UpgradeTooltip>
              );
            })}
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
