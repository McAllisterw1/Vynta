"use client";

import { useState, useEffect } from "react";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";
import MarkdownContent from "@/components/ui/MarkdownContent";

interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  trending: "improving" | "declining" | "stable";
  keywords: string[];
  summary: string;
  complaintThemes: Array<{ theme: string; severity: "low" | "medium" | "high" }>;
  praiseThemes: string[];
  actionableInsights: string[];
  risks: Array<{ description: string; severity: "low" | "medium" | "high" }>;
  executiveSummary: {
    improved: string;
    declined: string;
    biggestRisk: string;
    biggestOpportunity: string;
    recommendedAction: string;
  };
  operationalRecommendations: string[];
  competitorOpportunities?: Array<{ competitor: string; weakness: string; opportunity: string }>;
  lastAnalyzedAt?: string;
}

interface SentimentHistoryRecord {
  id: string;
  weekStart: string;
  data: SentimentAnalysis;
  createdAt: string;
}

interface ReportSynthesisRecord {
  id: string;
  monthLabel: string;
  content: string;
  createdAt: string;
}

interface Competitor {
  name: string;
  rating: number;
  reviewCount: number;
  analysisText: string | null;
  sentiment: string | null;
}

const CARD: React.CSSProperties = {
  background: "#E8DCC8",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
};

function SpinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{
        width: "14px", height: "14px", color: "#A0856A", flexShrink: 0,
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 200ms",
      }}
    >
      <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const d = new Date(now);
  d.setDate(now.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function getWeeklyCooldownInfo(lastRun: string | null): {
  coolingDown: boolean;
  nextMondayLabel: string;
} {
  if (!lastRun) return { coolingDown: false, nextMondayLabel: "" };

  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  if (new Date(lastRun) < weekStart) return { coolingDown: false, nextMondayLabel: "" };

  const daysUntilMonday = day === 1 ? 7 : day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  const nextMondayLabel = nextMonday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { coolingDown: true, nextMondayLabel };
}

function computeSentimentCacheKey(reviews: Array<{ id?: string; text?: string }>) {
  if (reviews.length === 0) return "";
  const ids = reviews.map((r) => r.id ?? "").filter(Boolean);
  if (ids.length === reviews.length) return ids.join("|");
  const first = reviews[0].text ?? "";
  const last = reviews[reviews.length - 1].text ?? "";
  return `${reviews.length}:${first.slice(0, 30)}:${last.slice(0, 30)}`;
}

export default function ReportsScreen({ plan }: { plan?: string | null } = {}) {
  // Monthly reports (persisted, folder UI)
  const [savedReports, setSavedReports] = useState<ReportSynthesisRecord[]>([]);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [monthlyGenerating, setMonthlyGenerating] = useState(false);

  // Sentiment history (feeds monthly report generation)
  const [sentimentHistory, setSentimentHistory] = useState<SentimentHistoryRecord[]>([]);

  // Sentiment analysis
  const [ourReviews, setOurReviews] = useState<Array<{ id?: string; text?: string }>>([]);
  const [sentimentData, setSentimentData] = useState<SentimentAnalysis | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentCacheKey, setSentimentCacheKey] = useState("");
  const [cacheStatus, setCacheStatus] = useState<"match" | "stale" | null>(null);
  const [sentimentLastRun, setSentimentLastRun] = useState<string | null>(null);

  // Weekly sentiment collapsible
  const [weeklyOpen, setWeeklyOpen] = useState(false);

  // Competitors (for attack list in monthly report)
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  useEffect(() => {
    // Load saved monthly reports and auto-open the most recent
    fetch("/api/user/report-synthesis")
      .then((r) => r.json())
      .then((data: ReportSynthesisRecord[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedReports(data);
          setOpenMonth(data[0].monthLabel);
        }
      })
      .catch(() => {});

    // Load sentiment history for monthly report generation
    fetch("/api/user/sentiment-history")
      .then((r) => r.json())
      .then((data: SentimentHistoryRecord[]) => {
        if (Array.isArray(data)) setSentimentHistory(data);
      })
      .catch(() => {});

    // Load competitors for attack list
    fetch("/api/user/competitors")
      .then((r) => r.json())
      .then((data: Competitor[]) => {
        if (Array.isArray(data)) setCompetitors(data);
      })
      .catch(() => {});

    // Load reviews for sentiment analysis
    fetch("/api/user/reviews")
      .then((r) => r.json())
      .then((reviews: Array<{ id?: string; text?: string }>) => {
        if (!Array.isArray(reviews)) return;
        setOurReviews(reviews);
        const key = computeSentimentCacheKey(reviews);
        setSentimentCacheKey(key);
      })
      .catch(() => {});

    // Load sentiment cache
    fetch("/api/user/sentiment-cache")
      .then((r) => r.json())
      .then((data: { cacheKey?: string; data?: SentimentAnalysis } | null) => {
        if (!data) return;
        if (data.data) {
          setSentimentData(data.data);
          if (data.data.lastAnalyzedAt) setSentimentLastRun(data.data.lastAnalyzedAt);
        }
        if (data.cacheKey) {
          setSentimentCacheKey((currentKey) => {
            if (currentKey && data.cacheKey === currentKey) {
              setCacheStatus("match");
            } else if (currentKey && data.cacheKey !== currentKey) {
              setCacheStatus("stale");
            }
            return currentKey;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sentimentCacheKey || !sentimentData) return;
    fetch("/api/user/sentiment-cache")
      .then((r) => r.json())
      .then((data: { cacheKey?: string } | null) => {
        if (!data?.cacheKey) return;
        setCacheStatus(data.cacheKey === sentimentCacheKey ? "match" : "stale");
      })
      .catch(() => {});
  }, [sentimentCacheKey]);

  async function analyzeSentiment() {
    if (ourReviews.length < 3 || sentimentLoading) return;
    setSentimentLoading(true);

    const system = "You are a reputation intelligence engine for local businesses. Return ONLY a raw JSON object — no markdown, no backticks, no explanation.";

    const reviewsText = ourReviews
      .slice(0, 150)
      .map((r, i) => `${i + 1}. ${r.text ?? ""}`)
      .filter((line) => line.trim().length > 5)
      .join("\n");

    const competitorWeakContext = competitors
      .filter((c) => c.analysisText)
      .map((c) => {
        try {
          const a = JSON.parse(c.analysisText ?? "{}") as { weaknesses?: string[] };
          const w = (a.weaknesses ?? []).slice(0, 3);
          if (!w.length) return null;
          return `${c.name}: ${w.join("; ")}`;
        } catch { return null; }
      })
      .filter(Boolean)
      .join("\n");

    const msg = `Analyze these customer reviews for a local business and return ONLY a raw JSON object — no markdown, no backticks, no extra text.

Return exactly this structure:
{
  "positive": <integer 0-100>,
  "neutral": <integer 0-100>,
  "negative": <integer 0-100>,
  "trending": "<improving|declining|stable — compare sentiment of first half vs second half of reviews>",
  "keywords": ["<6 most-mentioned themes, short strings, no filler words>"],
  "summary": "<one sentence overall sentiment>",
  "complaintThemes": [{ "theme": "<e.g. Wait times, Poor communication, Staff attitude, Pricing, Cleanliness, Scheduling>", "severity": "<low|medium|high>" }],
  "praiseThemes": ["<e.g. Friendly staff, Fast service, Professionalism, Quality work, Reliability>"],
  "actionableInsights": ["<specific insight e.g. 'Communication complaints appear in 4 of the last 10 reviews'>"],
  "risks": [{ "description": "<e.g. Legal-risk language detected in 1 review, Refund demand mentioned>", "severity": "<low|medium|high>" }],
  "executiveSummary": {
    "improved": "<what improved this period, or Nothing notable this period>",
    "declined": "<what declined, or Nothing notable>",
    "biggestRisk": "<biggest risk, or None identified>",
    "biggestOpportunity": "<biggest opportunity for this business>",
    "recommendedAction": "<single most important recommended action>"
  },
  "operationalRecommendations": ["<concrete operational recommendation>"],
  "competitorOpportunities": [{ "competitor": "<competitor name>", "weakness": "<what they're failing at>", "opportunity": "<specific action to win their customers>" }]
}

Rules:
- Only include complaintThemes actually present in the reviews (max 5, empty array if none)
- Only include praiseThemes actually present (max 5)
- Only flag genuine risks (max 3, empty array if none)
- 2-4 actionableInsights, 2-3 operationalRecommendations
- competitorOpportunities: 1-3 specific ways to win customers from competitor weaknesses listed below (empty array if no competitor data provided)
- Do not fabricate data not found in the reviews or competitor data
${competitorWeakContext ? `\nCompetitor weak spots:\n${competitorWeakContext}` : ""}

Reviews:
${reviewsText}`;

    try {
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: msg }], maxTokens: 1500 }),
      });
      const data = (await res.json()) as { response?: string };
      const raw = (data.response ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const now = new Date().toISOString();
      const parsed: SentimentAnalysis = { ...JSON.parse(jsonMatch[0]) as SentimentAnalysis, lastAnalyzedAt: now };
      setSentimentData(parsed);
      setSentimentLastRun(now);
      setCacheStatus("match");

      await fetch("/api/user/sentiment-cache", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cacheKey: sentimentCacheKey, data: parsed }),
      }).catch(() => {});

      fetch("/api/user/sentiment-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: getWeekStart(), data: parsed }),
      })
        .then(() => fetch("/api/user/sentiment-history").then((r) => r.json()))
        .then((hist) => {
          if (Array.isArray(hist)) setSentimentHistory(hist as SentimentHistoryRecord[]);
        })
        .catch(() => {});
    } catch {
      // silently fail
    } finally {
      setSentimentLoading(false);
    }
  }

  async function generateMonthlyReport() {
    if (sentimentHistory.length < 2 || monthlyGenerating) return;
    setMonthlyGenerating(true);

    const currentMonthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    try {
      const weeks = sentimentHistory.slice(0, 4).reverse();

      // Detect data gaps — flag if most recent week is >14 days old
      const mostRecentWeek = sentimentHistory[0];
      const daysSinceLastAnalysis = mostRecentWeek
        ? Math.floor((Date.now() - new Date(mostRecentWeek.weekStart + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const dataGapNote = daysSinceLastAnalysis !== null && daysSinceLastAnalysis > 14
        ? `⚠️ DATA GAP DETECTED: The most recent weekly analysis is ${daysSinceLastAnalysis} days old. This likely means the Smart Inbox was disconnected or no new reviews came in during this period. Call this out explicitly in the Month in Review section.`
        : "";

      const weeksText = weeks
        .map((record) => {
          const d = record.data;
          const weekLabel = new Date(record.weekStart + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return `**Week of ${weekLabel}:**
- Sentiment: ${d.positive ?? 0}% positive, ${d.neutral ?? 0}% neutral, ${d.negative ?? 0}% negative
- Trend: ${d.trending ?? "stable"}
- Summary: ${d.summary ?? "N/A"}
- Complaint themes: ${d.complaintThemes?.map((t) => `${t.theme} (${t.severity})`).join("; ") || "none"}
- Praise themes: ${d.praiseThemes?.join(", ") || "none"}
- Biggest risk: ${d.executiveSummary?.biggestRisk || "none identified"}
- Key opportunity: ${d.executiveSummary?.biggestOpportunity || "N/A"}
- Recommended action: ${d.executiveSummary?.recommendedAction || "N/A"}
- Operational recs: ${d.operationalRecommendations?.join("; ") || "N/A"}`;
        })
        .join("\n\n");

      // Build competitor context for attack list
      const competitorText = competitors.length > 0
        ? competitors.map((c) => {
            let weaknesses = "";
            try {
              const a = JSON.parse(c.analysisText ?? "{}") as { weaknesses?: string[] };
              weaknesses = (a.weaknesses ?? []).join(", ");
            } catch {}
            let negPct = "";
            try {
              const s = JSON.parse(c.sentiment ?? "{}") as { negative?: number };
              if (s.negative) negPct = `, ${s.negative}% negative sentiment`;
            } catch {}
            return `${c.name} (${c.rating}★, ${c.reviewCount} reviews${negPct}${weaknesses ? ` — complaints: ${weaknesses}` : ""})`;
          }).join("\n")
        : "No competitor data available";

      // Collect all recurring complaint themes across weeks
      const allComplaintThemes = weeks.flatMap((w) =>
        (w.data.complaintThemes ?? []).map((t) => t.theme)
      );
      const themeFrequency: Record<string, number> = {};
      for (const t of allComplaintThemes) {
        themeFrequency[t] = (themeFrequency[t] ?? 0) + 1;
      }
      const recurringComplaints = Object.entries(themeFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([theme, count]) => `${theme} (${count} of ${weeks.length} weeks)`)
        .join(", ");

      const system =
        "You are Vynta's AI reporting engine for local businesses. Write comprehensive, data-driven monthly business intelligence reports in clear markdown.";
      const prompt = `Synthesize these ${weeks.length} weekly sentiment analyses into a monthly business intelligence report.

${dataGapNote ? dataGapNote + "\n\n" : ""}${weeksText}

Competitor landscape:
${competitorText}

Recurring complaint themes this month: ${recurringComplaints || "none"}

Write a comprehensive monthly report in markdown with EXACTLY these sections in this order:
## Month in Review
## Sentiment Trend
(include a markdown table comparing metrics week-over-week)
## Recurring Themes
## Risk Assessment
## Strategic Recommendations
## Attack List
(This is the most important action section. Write 6-8 numbered, specific action items the business owner should execute this month. Mix two types:
  - OWN REVIEWS: Items that directly address recurring complaint themes from their own reviews — be specific about the exact issue and what to do
  - COMPETITOR GAPS: Items where competitors are getting complaints or underperforming — phrase as "Your competitors are getting complaints about [X]. Win those customers by doing [specific action]."
Label each item with [OWN] or [COMPETITOR GAP]. Rank by urgency.)

Be specific, compare week-over-week changes where data exists, and keep every recommendation actionable.`;

      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: prompt }], maxTokens: 4096 }),
      });
      const data = (await res.json()) as { response?: string };

      if (data.response) {
        await fetch("/api/user/report-synthesis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthLabel: currentMonthLabel, content: data.response }),
        }).catch(() => {});

        const refreshed = await fetch("/api/user/report-synthesis").then((r) => r.json()).catch(() => []);
        if (Array.isArray(refreshed)) {
          setSavedReports(refreshed as ReportSynthesisRecord[]);
        }
        setOpenMonth(currentMonthLabel);
      }
    } catch {
      // silently fail
    } finally {
      setMonthlyGenerating(false);
    }
  }

  const { coolingDown, nextMondayLabel } = getWeeklyCooldownInfo(sentimentLastRun);

  const currentMonthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const hasCurrentMonth = savedReports.some((r) => r.monthLabel === currentMonthLabel);

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <UpgradeTooltip locked={!canAccess(plan, "monthlyReports")} requiredPlan="Agency">
      <div style={{ padding: "28px 24px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1 }}>
                Reports
              </h1>
              <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "5px" }}>
                Weekly sentiment &amp; monthly synthesis
              </p>
            </div>
            <span style={{
              background: "rgba(45,155,138,0.12)", color: "#2D9B8A",
              borderRadius: "20px", padding: "4px 12px",
              fontSize: "11px", fontWeight: 700,
              letterSpacing: "0.06em", flexShrink: 0, marginTop: "4px",
            }}>
              AGENCY
            </span>
          </div>
        </div>

        {/* ── Monthly Reports ── */}
        <div style={{ marginBottom: "24px" }}>

          {/* Section label + generate button row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2D9B8A" }}>
                Monthly Reports
              </p>
              <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>
                AI synthesis of weekly analyses
              </p>
            </div>
            {sentimentHistory.length >= 2 && (
              <button
                type="button"
                onClick={generateMonthlyReport}
                disabled={monthlyGenerating}
                style={{
                  background: monthlyGenerating ? "#A0856A" : "#2D9B8A",
                  color: "white",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: monthlyGenerating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                  transition: "background 150ms",
                }}
              >
                {monthlyGenerating ? (
                  <><SpinIcon size={12} />Generating…</>
                ) : hasCurrentMonth ? (
                  `Regenerate ${currentMonthLabel.split(" ")[0]}`
                ) : (
                  `Generate ${currentMonthLabel.split(" ")[0]}`
                )}
              </button>
            )}
          </div>

          {/* Empty state */}
          {savedReports.length === 0 && (
            <div style={{ ...CARD, padding: "28px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.6 }}>
                {sentimentHistory.length < 2
                  ? "Run at least 2 weekly sentiment analyses to unlock monthly report generation."
                  : `Hit "Generate ${currentMonthLabel.split(" ")[0]}" above to create your first monthly report.`}
              </p>
            </div>
          )}

          {/* Regenerate note */}
          {savedReports.length > 0 && hasCurrentMonth && !monthlyGenerating && (
            <p style={{ fontSize: "10px", color: "#A0856A", marginBottom: "10px", marginTop: "-4px" }}>
              Regenerate to get a fresh report with updated competitor data and full complaint themes.
            </p>
          )}

          {/* Month folders */}
          {savedReports.map((report, idx) => {
            const isOpen = openMonth === report.monthLabel;
            const [monthName, year] = report.monthLabel.split(" ");
            const isNewest = idx === 0;
            const generatedDate = new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <div key={report.id} style={{ marginBottom: "8px" }}>
                <button
                  type="button"
                  onClick={() => setOpenMonth(isOpen ? null : report.monthLabel)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    background: "#E8DCC8",
                    borderRadius: isOpen ? "16px 16px 0 0" : "16px",
                    border: "none",
                    borderLeft: `3px solid ${isNewest ? "#2D9B8A" : "rgba(44,26,14,0.15)"}`,
                    padding: "13px 16px",
                    cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
                    transition: "border-radius 200ms",
                    textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#2C1A0E" }}>{monthName}</span>
                    <span style={{ fontSize: "12px", color: "#A0856A" }}>{year}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#A0856A", marginRight: "10px", flexShrink: 0 }}>
                    {generatedDate}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>

                {isOpen && (
                  <div style={{
                    background: "#E8DCC8",
                    borderRadius: "0 0 16px 16px",
                    borderLeft: `3px solid ${isNewest ? "#2D9B8A" : "rgba(44,26,14,0.15)"}`,
                    padding: "0 18px 18px",
                    boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
                  }}>
                    <div style={{ height: "1px", background: "rgba(44,26,14,0.08)", marginBottom: "16px" }} />
                    <div style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.75 }}>
                      <MarkdownContent>{report.content}</MarkdownContent>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Sentiment Intelligence ── */}
        <UpgradeTooltip locked={!canAccess(plan, "sentimentAnalysis")} requiredPlan="Agency">
        <div>

          {/* Section header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2D9B8A" }}>
                Sentiment Intelligence
              </p>
              <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>
                AI-powered · {ourReviews.length} review{ourReviews.length !== 1 ? "s" : ""} analyzed
              </p>
            </div>
            {sentimentData && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {coolingDown
                  ? <span style={{ fontSize: "10px", color: "#A0856A", fontWeight: 600 }}>Next report Mon, {nextMondayLabel}</span>
                  : cacheStatus === "stale"
                  ? <span style={{ fontSize: "10px", color: "#C4874A", fontWeight: 600 }}>New reviews detected</span>
                  : <span style={{ fontSize: "10px", color: "#2D9B8A", fontWeight: 600 }}>Up to date</span>
                }
                {!coolingDown && (
                  <button
                    type="button"
                    onClick={analyzeSentiment}
                    disabled={sentimentLoading}
                    aria-label="Refresh sentiment"
                    style={{
                      background: "none", border: "none",
                      cursor: sentimentLoading ? "default" : "pointer",
                      color: "#A0856A", padding: "2px", lineHeight: 0,
                      opacity: sentimentLoading ? 0.4 : 1,
                    }}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px" }}>
                      <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.75.75 0 0 1 1.36-.636A6.5 6.5 0 1 1 8 1.5v-.75a.25.25 0 0 1 .427-.177l2.25 2.25a.25.25 0 0 1 0 .354l-2.25 2.25A.25.25 0 0 1 8 5.25V3Z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {ourReviews.length < 3 ? (
            <div style={{ ...CARD, padding: "28px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#A0856A" }}>
                Log at least 3 reviews to unlock sentiment intelligence.
              </p>
            </div>
          ) : !sentimentData ? (
            <div style={{ ...CARD, padding: "18px" }}>
              <p style={{ fontSize: "12px", color: "#7B5E45", marginBottom: "12px", lineHeight: 1.6 }}>
                Generate your weekly sentiment report — complaint themes, risk flags, executive summary, and operational recommendations. Refreshes every Monday.
              </p>
              <button
                type="button"
                onClick={analyzeSentiment}
                disabled={sentimentLoading}
                style={{
                  width: "100%", background: sentimentLoading ? "#A0856A" : "#2C1A0E",
                  color: "white", borderRadius: "10px", padding: "10px",
                  fontSize: "13px", fontWeight: 600, border: "none",
                  cursor: sentimentLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {sentimentLoading ? <><SpinIcon size={13} />Analysing {ourReviews.length} reviews…</> : "Generate Weekly Sentiment Analysis Report"}
              </button>
            </div>
          ) : (
            <>
              {/* ── Weekly report CTA — shown when a new week has started ── */}
              {!coolingDown && (
                <div style={{ ...CARD, padding: "16px", marginBottom: "10px", border: "1.5px solid rgba(45,155,138,0.3)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D9B8A", marginBottom: "6px" }}>
                    New Week Available
                  </p>
                  <p style={{ fontSize: "12px", color: "#7B5E45", marginBottom: "12px", lineHeight: 1.6 }}>
                    Your weekly sentiment report is ready to generate. Results below are from last week.
                  </p>
                  <button
                    type="button"
                    onClick={analyzeSentiment}
                    disabled={sentimentLoading}
                    style={{
                      width: "100%", background: sentimentLoading ? "#A0856A" : "#2D9B8A",
                      color: "white", borderRadius: "10px", padding: "10px",
                      fontSize: "13px", fontWeight: 600, border: "none",
                      cursor: sentimentLoading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}
                  >
                    {sentimentLoading ? <><SpinIcon size={13} />Analysing {ourReviews.length} reviews…</> : "Generate Weekly Sentiment Analysis Report"}
                  </button>
                </div>
              )}

              {/* ── Weekly detail — collapsible ── */}
              <button
                type="button"
                onClick={() => setWeeklyOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  background: "#E8DCC8",
                  borderRadius: weeklyOpen ? "16px 16px 0 0" : "16px",
                  border: "none",
                  borderLeft: "3px solid rgba(45,155,138,0.4)",
                  padding: "12px 16px",
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
                  marginBottom: weeklyOpen ? 0 : "10px",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2C1A0E" }}>This Week&apos;s Sentiment Detail</span>
                  <span style={{
                    marginLeft: "10px",
                    fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px",
                    background: sentimentData.trending === "improving" ? "rgba(45,155,138,0.12)" : sentimentData.trending === "declining" ? "rgba(192,57,43,0.1)" : "rgba(44,26,14,0.06)",
                    color: sentimentData.trending === "improving" ? "#2D9B8A" : sentimentData.trending === "declining" ? "#C0392B" : "#7B5E45",
                  }}>
                    {sentimentData.positive}% positive · {sentimentData.trending === "improving" ? "↑ Improving" : sentimentData.trending === "declining" ? "↓ Declining" : "→ Stable"}
                  </span>
                </div>
                <ChevronIcon open={weeklyOpen} />
              </button>

              {weeklyOpen && (
                <div style={{
                  background: "#E8DCC8",
                  borderRadius: "0 0 16px 16px",
                  borderLeft: "3px solid rgba(45,155,138,0.4)",
                  padding: "0 14px 14px",
                  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
                  marginBottom: "10px",
                }}>
                  <div style={{ height: "1px", background: "rgba(44,26,14,0.08)", marginBottom: "14px" }} />

                  {/* 1. Sentiment Breakdown */}
                  <div style={{ ...CARD, padding: "16px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                      {([
                        { label: "Positive", value: sentimentData.positive, color: "#2D9B8A" },
                        { label: "Neutral",  value: sentimentData.neutral,  color: "#C4874A" },
                        { label: "Negative", value: sentimentData.negative, color: "#C0392B" },
                      ] as const).map(({ label, value, color }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#7B5E45", width: "54px", flexShrink: 0 }}>{label}</span>
                          <div style={{ flex: 1, height: "8px", borderRadius: "99px", background: "rgba(44,26,14,0.08)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "99px", background: color, width: `${value}%`, transition: "width 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)" }} />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#2C1A0E", width: "32px", textAlign: "right", flexShrink: 0 }}>{value}%</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: "12px", color: "#7B5E45", lineHeight: 1.6, margin: 0 }}>{sentimentData.summary}</p>
                  </div>

                  {/* 2. Executive Summary */}
                  {sentimentData.executiveSummary && (
                    <div style={{ ...CARD, padding: "16px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", marginBottom: "12px" }}>
                        Executive Summary
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                        {([
                          { icon: "✅", label: "Improved",     value: sentimentData.executiveSummary.improved },
                          { icon: "⚠️", label: "Declined",     value: sentimentData.executiveSummary.declined },
                          { icon: "🚨", label: "Biggest Risk", value: sentimentData.executiveSummary.biggestRisk },
                          { icon: "💡", label: "Opportunity",  value: sentimentData.executiveSummary.biggestOpportunity },
                        ] as const).map(({ icon, label, value }) => (
                          <div key={label} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A0856A" }}>{label} </span>
                              <span style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.5 }}>{value}</span>
                            </div>
                          </div>
                        ))}
                        <div style={{ paddingTop: "10px", borderTop: "1px solid rgba(44,26,14,0.08)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "13px", flexShrink: 0 }}>→</span>
                          <div>
                            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2D9B8A" }}>Recommended Action </span>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#2C1A0E" }}>{sentimentData.executiveSummary.recommendedAction}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Complaint + Praise Themes */}
                  {((sentimentData.complaintThemes?.length ?? 0) > 0 || (sentimentData.praiseThemes?.length ?? 0) > 0) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ ...CARD, padding: "14px" }}>
                        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C0392B", marginBottom: "10px" }}>
                          Top Complaints
                        </p>
                        {(sentimentData.complaintThemes ?? []).length === 0 ? (
                          <p style={{ fontSize: "11px", color: "#A0856A" }}>None detected</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(sentimentData.complaintThemes ?? []).map((t) => (
                              <div key={t.theme} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                                <span style={{ fontSize: "11px", color: "#2C1A0E", fontWeight: 500, lineHeight: 1.3 }}>{t.theme}</span>
                                <span style={{
                                  fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", flexShrink: 0,
                                  background: t.severity === "high" ? "rgba(192,57,43,0.1)" : t.severity === "medium" ? "rgba(196,135,74,0.1)" : "rgba(44,26,14,0.06)",
                                  color: t.severity === "high" ? "#C0392B" : t.severity === "medium" ? "#C4874A" : "#7B5E45",
                                }}>
                                  {t.severity.toUpperCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ ...CARD, padding: "14px" }}>
                        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D9B8A", marginBottom: "10px" }}>
                          Top Praise
                        </p>
                        {(sentimentData.praiseThemes ?? []).length === 0 ? (
                          <p style={{ fontSize: "11px", color: "#A0856A" }}>None detected</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(sentimentData.praiseThemes ?? []).map((t) => (
                              <div key={t} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2D9B8A", flexShrink: 0 }} />
                                <span style={{ fontSize: "11px", color: "#2C1A0E", fontWeight: 500 }}>{t}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. Risk Flags */}
                  {(sentimentData.risks ?? []).length > 0 && (
                    <div style={{ ...CARD, padding: "14px", marginBottom: "10px", borderLeft: "3px solid #C0392B" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C0392B", marginBottom: "10px" }}>
                        Risk Flags
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(sentimentData.risks ?? []).map((r) => (
                          <div key={r.description} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{
                              fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", flexShrink: 0, marginTop: "1px",
                              background: r.severity === "high" ? "rgba(192,57,43,0.12)" : "rgba(196,135,74,0.1)",
                              color: r.severity === "high" ? "#C0392B" : "#C4874A",
                            }}>
                              {r.severity.toUpperCase()}
                            </span>
                            <span style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.5 }}>{r.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Actionable Insights */}
                  {(sentimentData.actionableInsights ?? []).length > 0 && (
                    <div style={{ ...CARD, padding: "14px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "10px" }}>
                        Actionable Insights
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(sentimentData.actionableInsights ?? []).map((insight) => (
                          <div key={insight} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <span style={{
                              width: "18px", height: "18px", borderRadius: "50%", background: "rgba(45,155,138,0.12)",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px",
                            }}>
                              <span style={{ fontSize: "9px", color: "#2D9B8A", fontWeight: 700 }}>→</span>
                            </span>
                            <span style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.5 }}>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Operational Recommendations */}
                  {(sentimentData.operationalRecommendations ?? []).length > 0 && (
                    <div style={{ ...CARD, padding: "14px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "10px" }}>
                        Operational Recommendations
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(sentimentData.operationalRecommendations ?? []).map((rec, i) => (
                          <div key={rec} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <span style={{
                              width: "18px", height: "18px", borderRadius: "50%", background: "#2C1A0E",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, marginTop: "1px", fontSize: "9px", color: "white", fontWeight: 700,
                            }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.5 }}>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 7. Rival Opportunities */}
                  {(sentimentData.competitorOpportunities ?? []).length > 0 && (
                    <div style={{ ...CARD, padding: "14px", marginBottom: "10px", borderLeft: "3px solid #2D9B8A" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D9B8A", marginBottom: "12px" }}>
                        Rival Opportunities
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(sentimentData.competitorOpportunities ?? []).map((opp) => (
                          <div key={opp.competitor} style={{ borderLeft: "2px solid rgba(45,155,138,0.3)", paddingLeft: "10px" }}>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: "#A0856A", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{opp.competitor}</p>
                            <p style={{ fontSize: "11px", color: "#7B5E45", marginBottom: "4px" }}>Weak on: {opp.weakness}</p>
                            <p style={{ fontSize: "12px", color: "#2C1A0E", fontWeight: 500 }}>→ {opp.opportunity}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {(sentimentData.keywords ?? []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(sentimentData.keywords ?? []).map((kw) => (
                        <span key={kw} style={{ background: "rgba(44,26,14,0.08)", color: "#7B5E45", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: 600 }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
        </UpgradeTooltip>

      </div>
      </UpgradeTooltip>
    </div>
  );
}
