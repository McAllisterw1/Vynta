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
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #C4874A, #E0A06A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
  rating: number;
  date?: string;
}

interface Props {
  plan: string | null;
  subscriptionStatus: string | null;
}

export default function HomeScreen({ plan, subscriptionStatus }: Props) {
  const { history, addEntry } = useResponseHistory();
  const { count, limit, increment, atLimit } = useMonthlyUsage(plan);

  const [mounted, setMounted] = useState(false);
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
  const [dbReviewCount, setDbReviewCount] = useState<number | null>(null);
  const [inboxReviewCount, setInboxReviewCount] = useState<number | null>(null);
  const ourReviewCount = inboxReviewCount ?? dbReviewCount;
  const [ourAvgRating, setOurAvgRating] = useState<number | null>(null);
  const [googleSourcedRating, setGoogleSourcedRating] = useState<number | null>(() => {
    try {
      const s = localStorage.getItem("vynta_google_rating");
      if (s) { const n = parseFloat(s); if (!isNaN(n)) return n; }
    } catch {}
    return null;
  });
  const [recentNegativeReviews, setRecentNegativeReviews] = useState<CrisisReview[]>([]);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisActionPlan, setCrisisActionPlan] = useState<string | null>(null);
  const [crisisLoading, setCrisisLoading] = useState(false);
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Your Next Move — reads the cached weekly tip written by the Reports/Analytics screen
  const [nextMoveTip, setNextMoveTip] = useState<string>("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", showScoreModal);
    return () => { document.body.classList.remove("modal-open"); };
  }, [showScoreModal]);

  // Keep stat cards in sync when Reviews tab syncs new reviews
  useEffect(() => {
    const handler = (e: Event) => {
      const { dbCount, inboxCount, googleRating } = (e as CustomEvent<{ dbCount?: number; inboxCount?: number | null; googleRating?: number | null }>).detail;
      if (dbCount != null) setDbReviewCount(dbCount);
      if (inboxCount != null) setInboxReviewCount(inboxCount);
      if (googleRating != null) {
        setGoogleSourcedRating(googleRating);
        try { localStorage.setItem("vynta_google_rating", String(googleRating)); } catch {}
      }
    };
    window.addEventListener("vynta:reviews-updated", handler);
    return () => window.removeEventListener("vynta:reviews-updated", handler);
  }, []);

  useEffect(() => {
    // Load settings
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((data: { businessName?: string; defaultTone?: string }) => {
        if (data.businessName) setBusinessName(data.businessName);
        if (data.defaultTone) setTone(data.defaultTone as Tone);
      })
      .catch(() => {});

    // Load reviews for stats and crisis detection
    fetch("/api/user/reviews?slim=true")
      .then((r) => r.json())
      .then((reviews: CrisisReview[]) => {
        if (!Array.isArray(reviews)) return;
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : null;
        setDbReviewCount(total);
        if (avg !== null) setOurAvgRating(parseFloat(avg.toFixed(1)));

        const cutoff = Date.now() - 48 * 60 * 60 * 1000;
        const negatives = reviews.filter((r) => {
          const dateStr = r.date;
          if (!dateStr) return false;
          return new Date(dateStr).getTime() >= cutoff && r.rating <= 3;
        });
        setRecentNegativeReviews(negatives);
        const detected = negatives.length >= 2;
        setCrisisDetected(detected);
        if (detected) {
          try {
            const dismissedRaw = localStorage.getItem("vynta_crisis_dismissed");
            if (dismissedRaw) {
              const { dismissedAt, reviewCount } = JSON.parse(dismissedRaw) as { dismissedAt: number; reviewCount: number };
              const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
              if (negatives.length === reviewCount && hoursSince < 24) setCrisisDismissed(true);
            }
          } catch {}
        }
      })
      .catch(() => {});

    // Smart inbox count — prefer Outscraper total, fall back to DB count
    Promise.all([
      fetch("/api/user/smart-inbox").then((r) => r.json()).catch(() => null),
      fetch("/api/user/reviews?slim=true").then((r) => r.json()).catch(() => []),
    ]).then(([inbox, reviews]) => {
      const inboxCount = (inbox as { lastKnownCount?: number } | null)?.lastKnownCount;
      if (inboxCount && inboxCount > 0) {
        setInboxReviewCount(inboxCount);
      } else if (Array.isArray(reviews) && reviews.length > 0) {
        setInboxReviewCount(reviews.length);
      }
    }).catch(() => {});

    // Campaigns for requests sent (still needed for rep score calc)
    fetch("/api/user/campaigns")
      .then((r) => r.json())
      .then((campaigns: Array<{ contacts: unknown[] }>) => {
        if (!Array.isArray(campaigns)) return;
        const total = campaigns.reduce((sum, c) => sum + (Array.isArray(c.contacts) ? c.contacts.length : 0), 0);
        setRequestsSent(total);
      })
      .catch(() => {});

    // Read cached weekly tip from localStorage (written by Reports screen — no API call)
    try {
      const raw = localStorage.getItem("vynta_weekly_tip");
      if (raw) {
        const { tip } = JSON.parse(raw) as { tip: string; savedAt: number };
        if (tip) setNextMoveTip(tip);
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
      const compsRes = await fetch("/api/user/competitors");
      const comps = await compsRes.json() as Array<{ name: string; rating: number; reviewCount: number }>;
      if (comps.length > 0) competitorContext = comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ");
    } catch {}
    const system = "You are a trusted reputation management advisor. Be direct, urgent, and practical.";
    const msg = `A local service business is experiencing a reputation crisis. They have received ${recentNegativeReviews.length} negative reviews (3 stars or below) in the last 48 hours. Here are the reviews:
${recentNegativeReviews.map((r, i) => `${i + 1}. "${r.text ?? ""}" — ${r.rating} stars`).join("\n")}
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
      let competitorContext = "";
      try {
        const compsRes = await fetch("/api/user/competitors");
        const comps = await compsRes.json() as Array<{ name: string; rating: number; reviewCount: number }>;
        if (comps.length > 0) competitorContext = comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ");
      } catch {}

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
          competitorContext,
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

  // ── Reputation Score ──────────────────────────────────────────────────────
  const displayRating  = googleSourcedRating ?? ourAvgRating;
  const hasScoreData   = displayRating !== null && ourReviewCount !== null;
  const ratingPts      = hasScoreData ? (displayRating! / 5) * 40 : 0;
  const volumePts      = hasScoreData ? Math.min(ourReviewCount! / 50, 1) * 25 : 0;
  const responseRate   = hasScoreData && ourReviewCount! > 0 ? Math.min(history.length / ourReviewCount!, 1) : 0;
  const responsePts    = responseRate * 20;
  const activityPts    = Math.min(requestsSent / 20, 1) * 15;
  const repScore       = hasScoreData ? Math.round(ratingPts + volumePts + responsePts + activityPts) : null;

  const scoreGrade = repScore === null ? null
    : repScore >= 80 ? { label: "Excellent", color: "#2D9B8A" }
    : repScore >= 65 ? { label: "Good",      color: "#2D9B8A" }
    : repScore >= 50 ? { label: "Fair",       color: "#C4874A" }
    :                  { label: "Needs Work", color: "#DC2626" };

  const scoreBreakdown = [
    { label: "Star Rating",    pts: Math.round(ratingPts),   max: 40, detail: displayRating !== null ? `${displayRating}★ average` : "No reviews yet",          tip: "Aim for a 4.5+ average. Respond to negatives fast." },
    { label: "Review Volume",  pts: Math.round(volumePts),   max: 25, detail: ourReviewCount !== null ? `${ourReviewCount} reviews` : "No reviews yet",          tip: "50+ reviews builds strong trust signals." },
    { label: "Response Rate",  pts: Math.round(responsePts), max: 20, detail: `${Math.round(responseRate * 100)}% of reviews responded`,                         tip: "Responding to every review boosts your score." },
    { label: "Review Activity",pts: Math.round(activityPts), max: 15, detail: `${requestsSent} requests sent`,                                                   tip: "Consistent outreach keeps new reviews coming." },
  ];

  const CIRC = 2 * Math.PI * 36; // radius 36

  // ── Your Next Move fallback — derived from existing state, no API call ────
  const derivedNextMove = (() => {
    if (!hasScoreData) return "Log your first reviews in the Reviews tab to unlock personalized AI recommendations.";
    const unresponded = (dbReviewCount ?? 0) - history.length;
    if (unresponded > 3) return `You have ${unresponded} reviews without a response — replying to each one will meaningfully boost your Reputation Score.`;
    if (displayRating !== null && displayRating < 4.2) return "Your rating has room to grow. Prioritize responding to negative reviews and requesting 5-star reviews from satisfied customers.";
    if ((ourReviewCount ?? 0) < 20) return "Volume builds trust — send a review request campaign to recent customers to grow your review count and strengthen your score.";
    return "Your reputation is in solid shape. Keep momentum by responding to new reviews promptly and running a weekly sentiment analysis in Reports.";
  })();

  const nextMoveText = nextMoveTip || derivedNextMove;

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
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "#FAF5E8", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {planData && isActive ? (
          <span style={{ background: "#E8DCC8", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600, color: "#C4874A", textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: "0 1px 4px rgba(44,26,14,0.1)" }}>
            {planData.name}
          </span>
        ) : (
          <a href="/#pricing" style={{ fontSize: "12px", fontWeight: 600, color: "#2D9B8A" }}>Get a plan →</a>
        )}
      </header>

      <div style={{ padding: "20px 20px 120px" }}>

        {/* ── Reputation Crisis Alert ── */}
        {crisisDetected && !crisisDismissed && (
          <UpgradeTooltip locked={!canAccess(plan, "crisisDetection")} requiredPlan="Agency">
          <div style={{ background: "#1a0a0a", border: "1px solid #C0392B", borderRadius: "16px", padding: "18px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#C0392B", flexShrink: 0, display: "inline-block", animation: "crisis-pulse 1.5s ease-in-out infinite" }} />
              <p style={{ fontSize: "14px", fontWeight: 700, color: "white", margin: 0 }}>⚠️ Reputation Crisis Detected</p>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(192,57,43,0.85)", marginBottom: "14px", paddingLeft: "20px" }}>
              {recentNegativeReviews.length} negative review{recentNegativeReviews.length !== 1 ? "s" : ""} in the last 48 hours — act now
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              {recentNegativeReviews.map((r, i) => (
                <div key={r.id ?? i} style={{ background: "rgba(192,57,43,0.1)", borderRadius: "8px", padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <Stars rating={r.rating} size="sm" />
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>{r.rating} star{r.rating !== 1 ? "s" : ""}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.78)", margin: 0, lineHeight: 1.5 }}>&ldquo;{r.text ?? "(no review text)"}&rdquo;</p>
                </div>
              ))}
            </div>
            {!crisisActionPlan ? (
              <>
                <button type="button" onClick={fetchCrisisActionPlan} disabled={crisisLoading}
                  style={{ width: "100%", background: crisisLoading ? "rgba(192,57,43,0.55)" : "#C0392B", color: "white", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 700, border: "none", cursor: crisisLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px", transition: "background 150ms" }}>
                  {crisisLoading ? (
                    <><svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" /></svg>Building action plan…</>
                  ) : "Get Action Plan"}
                </button>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textAlign: "center", margin: 0 }}>Powered by Vynta</p>
              </>
            ) : (
              <>
                <div style={{ height: "1px", background: "rgba(192,57,43,0.25)", margin: "4px 0 14px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(192,57,43,0.85)", fontWeight: 600, margin: 0 }}>Action Plan</p>
                  <button type="button" onClick={fetchCrisisActionPlan} disabled={crisisLoading} aria-label="Regenerate action plan"
                    style={{ background: "none", border: "none", cursor: crisisLoading ? "not-allowed" : "pointer", color: "rgba(255,255,255,0.35)", padding: "2px", lineHeight: 0 }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "13px", height: "13px" }}>
                      <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.75.75 0 0 1 1.36-.636A6.5 6.5 0 1 1 8 1.5v-.75a.25.25 0 0 1 .427-.177l2.25 2.25a.25.25 0 0 1 0 .354l-2.25 2.25A.25.25 0 0 1 8 5.25V3Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="crisis-md"><MarkdownContent>{crisisActionPlan}</MarkdownContent></div>
              </>
            )}
            <button type="button" onClick={dismissCrisis}
              style={{ width: "100%", marginTop: "14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px", fontSize: "11px", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
              Dismiss until new reviews
            </button>
          </div>
          </UpgradeTooltip>
        )}

        {/* ── 3 Stat Cards: Total Reviews · Avg Rating · Rep Score ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>

          {/* Total Reviews */}
          <div style={{ ...CARD, padding: "16px" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>
              {ourReviewCount !== null ? ourReviewCount : "—"}
            </p>
            <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "6px", lineHeight: 1.3 }}>
              Total Reviews
            </p>
          </div>

          {/* Avg Rating */}
          <div style={{ ...CARD, padding: "16px" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>
              {!mounted ? "—" : (displayRating !== null ? displayRating : "—")}
            </p>
            <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "6px", lineHeight: 1.3 }}>
              Avg Rating
            </p>
          </div>

          {/* Reputation Score — circle ring, tappable */}
          <button
            type="button"
            onClick={() => repScore !== null && setShowScoreModal(true)}
            style={{ ...CARD, padding: "14px 10px", border: "none", cursor: repScore !== null ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}
          >
            <div style={{ position: "relative", width: "56px", height: "56px" }}>
              <svg viewBox="0 0 88 88" style={{ width: "56px", height: "56px", transform: "rotate(-90deg)" }}>
                <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(44,26,14,0.08)" strokeWidth="8" />
                <circle
                  cx="44" cy="44" r="36" fill="none"
                  stroke={repScore !== null ? (scoreGrade?.color ?? "#2D9B8A") : "rgba(44,26,14,0.08)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={repScore !== null ? CIRC * (1 - repScore / 100) : CIRC}
                  style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "17px", fontWeight: 800, color: repScore !== null ? (scoreGrade?.color ?? "#2D9B8A") : "#A0856A", lineHeight: 1 }}>
                  {repScore ?? "—"}
                </span>
              </div>
            </div>
            <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", lineHeight: 1.3, textAlign: "center" }}>
              Rep Score
            </p>
            {scoreGrade && (
              <p style={{ fontSize: "10px", fontWeight: 700, color: scoreGrade.color, textAlign: "center", lineHeight: 1 }}>
                {scoreGrade.label}
              </p>
            )}
          </button>
        </div>

        {/* ── Score Breakdown Modal ── */}
        {showScoreModal && repScore !== null && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(44,26,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 20px 100px" }}
            onClick={() => setShowScoreModal(false)}
          >
            <div
              style={{ background: "#FAF5E8", borderRadius: "20px", width: "100%", maxWidth: "400px", maxHeight: "80vh", overflowY: "auto", padding: "24px", boxShadow: "0 8px 40px rgba(44,26,14,0.22)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
                  <svg viewBox="0 0 88 88" style={{ width: "72px", height: "72px", transform: "rotate(-90deg)" }}>
                    <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(44,26,14,0.08)" strokeWidth="8" />
                    <circle cx="44" cy="44" r="36" fill="none" stroke={scoreGrade?.color} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - repScore / 100)} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: scoreGrade?.color, lineHeight: 1 }}>{repScore}</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", fontWeight: 600, marginBottom: "2px" }}>Reputation Score</p>
                  <p className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: scoreGrade?.color }}>{scoreGrade?.label}</p>
                  <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>Based on {ourReviewCount} reviews · updated live</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                {scoreBreakdown.map((item) => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#2C1A0E" }}>{item.label}</span>
                      <span style={{ fontSize: "11px", color: "#A0856A" }}>{item.pts} / {item.max} pts</span>
                    </div>
                    <div style={{ height: "6px", background: "rgba(44,26,14,0.08)", borderRadius: "99px", overflow: "hidden", marginBottom: "4px" }}>
                      <div style={{
                        height: "100%",
                        width: `${(item.pts / item.max) * 100}%`,
                        background: item.pts >= item.max * 0.8 ? "#2D9B8A" : item.pts >= item.max * 0.5 ? "#C4874A" : "#DC2626",
                        borderRadius: "99px",
                        transition: "width 500ms cubic-bezier(0.4,0,0.2,1)",
                      }} />
                    </div>
                    <p style={{ fontSize: "10px", color: "#A0856A" }}>{item.detail}{item.pts < item.max ? ` — ${item.tip}` : ""}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                style={{ width: "100%", background: "#2C1A0E", color: "white", borderRadius: "12px", padding: "13px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* ── Your Next Move ── */}
        <div style={{
          background: "#E8DCC8",
          borderRadius: "16px",
          boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
          borderLeft: "4px solid #2D9B8A",
          padding: "20px 20px 20px 18px",
          marginBottom: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "13px", height: "13px", color: "#2D9B8A", flexShrink: 0 }}>
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
            </svg>
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#2D9B8A", fontWeight: 700 }}>
              Your Next Move
            </p>
            {nextMoveTip && (
              <span style={{ marginLeft: "auto", fontSize: "9px", color: "#A0856A", fontWeight: 500 }}>
                AI · updated weekly
              </span>
            )}
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#2C1A0E", lineHeight: 1.65, margin: 0 }}>
            {nextMoveText}
          </p>
        </div>

        {/* ── Vynta AI Responder ── */}
        <div style={{ ...CARD, padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E" }}>
              Vynta AI Responder
            </h2>
            <span style={{ fontSize: "10px", color: "#A0856A" }}>{usageLabel}</span>
          </div>

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

        {/* ── Response History ── */}
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
