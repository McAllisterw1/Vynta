"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { PDFReportData } from "@/components/pdf/VyntaReport";

const DownloadReportButton = dynamic(
  () => import("@/components/pdf/DownloadReportButton"),
  { ssr: false }
);
import { calculateRevenueAtRisk, formatCurrency } from "@/lib/revenueCalc";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// ── Types ─────────────────────────────────────────────────────────────────────

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
  lastAnalyzedAt?: string;
}

interface SentimentHistoryRecord {
  id: string;
  weekStart: string;
  data: SentimentAnalysis;
  createdAt: string;
}

interface SlimReview {
  id?: string;
  rating: number;
  date: string;
  responded: boolean;
}

interface Competitor {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  sentiment: string | null;
  trend: string | null;
  velocity: string | null;
  analysisText: string | null;
  lastAnalyzed: string | null;
  zipCode?: string;
}

interface ThreatAnalysis {
  biggestThreat: string;
  beatingUser: string;
  userBeating: string;
  actions: string[];
}

interface MarketIntel {
  emergingThemes: string[];
  opportunityGap: string;
  whatTopBusinessesDo: string;
}

interface WeakpointAction {
  weakness: string;
  competitors: string;
  action: string;
  howToWin: string;
}

interface SearchIntelligence {
  searchVisibility: {
    summary: string;
    rank: string;
    insights: string[];
  };
  marketPosition: {
    topPlayers: Array<{ name: string; note: string }>;
    opportunities: string[];
  };
  competitorOnlinePresence: Array<{
    name: string;
    searchSummary: string;
    vulnerability: string;
  }>;
  marketTrends: {
    emerging: string[];
    recommendation: string;
  };
}

interface Warning {
  type: "warning" | "positive" | "info";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
}

interface EarlyWarningsResponse {
  warnings: Warning[];
  insufficient_data: boolean;
  weeksAnalyzed?: number;
}

interface RevenueOpportunity {
  title: string;
  impact: "high" | "medium" | "low";
  estimatedValue: string;
  detail: string;
  action: string;
  timeToImpact: string;
}

interface CompetitorGap {
  title: string;
  competitor: string;
  opportunity: string;
  detail: string;
  urgency: "act now" | "this month" | "long term";
}

interface QuickWin {
  action: string;
  why: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

interface OpportunitiesData {
  revenueOpportunities: RevenueOpportunity[];
  competitorGaps: CompetitorGap[];
  quickWins: QuickWin[];
}

// ── Style constants ───────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "#120804",
  borderRadius: "16px",
  border: "1px solid rgba(45,155,138,0.12)",
};

const TEAL  = "#2D9B8A";
const AMBER = "#C4874A";
const RED   = "#DC2626";
const DARK  = "rgba(255,255,255,0.9)";
const MUTED = "rgba(255,255,255,0.45)";

const COMP_COLORS = ["#C4874A", "#8B6F5E", "#4A9B8A", "#C4A47A", "#7B5E45"];

// ── localStorage helpers ──────────────────────────────────────────────────────

const TTL      = 24 * 60 * 60 * 1000;
const TTL_6H   =  6 * 60 * 60 * 1000;
const TTL_12H  = 12 * 60 * 60 * 1000;

function lsGet<T>(key: string, ttl = TTL): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw) as { data: T; savedAt: number };
    if (Date.now() - savedAt > ttl) return null;
    return data;
  } catch { return null; }
}

function lsSet(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() })); } catch {}
}

// ── Chart option factories ────────────────────────────────────────────────────

const BASE_TICK = { font: { size: 10 as const }, color: MUTED };
const BASE_GRID = { color: "rgba(255,255,255,0.05)" as const };

function lineOpts() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { bodyFont: { size: 11 as const } },
    },
    scales: {
      x: { grid: { display: false }, ticks: BASE_TICK },
      y: { grid: BASE_GRID, ticks: BASE_TICK, beginAtZero: false },
    },
  };
}

function barOpts(stacked = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { bodyFont: { size: 11 as const } },
    },
    scales: {
      x: { stacked, grid: { display: false }, ticks: BASE_TICK },
      y: { stacked, grid: BASE_GRID, ticks: BASE_TICK, beginAtZero: true },
    },
  };
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function parseVelocity(v: string | null): number {
  if (!v) return 0;
  const m = v.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

function buildWeekBuckets(reviews: SlimReview[], count = 8) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const end = new Date(now);
    end.setDate(now.getDate() - (count - 1 - i) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    const bucket = reviews.filter(r => { const d = new Date(r.date); return d >= start && d < end; });
    return {
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avgRating: bucket.length > 0
        ? parseFloat((bucket.reduce((s, r) => s + r.rating, 0) / bucket.length).toFixed(1))
        : null,
      count: bucket.length,
    };
  });
}

function parseSentiment(s: string | null): { positive: number; negative: number } {
  try { return JSON.parse(s ?? "{}") as { positive: number; negative: number }; } catch { return { positive: 0, negative: 0 }; }
}

function parseAnalysis(s: string | null): { summary?: string; strengths?: string[]; weaknesses?: string[] } {
  try { return JSON.parse(s ?? "{}") as { summary?: string; strengths?: string[]; weaknesses?: string[] }; } catch { return {}; }
}

// ── Shared small components ───────────────────────────────────────────────────

function SpinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

function Skeleton({ height = 120 }: { height?: number }) {
  return (
    <div style={{
      height,
      borderRadius: "12px",
      background: "rgba(255,255,255,0.07)",
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

function ErrorMsg({ msg = "Unable to load" }: { msg?: string }) {
  return (
    <p style={{ fontSize: "12px", color: MUTED, padding: "20px 0", textAlign: "center" }}>{msg}</p>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: MUTED, marginBottom: "12px" }}>
      {children}
    </p>
  );
}

const INTEL_CACHE_KEYS = [
  "vynta_early_warnings",
  "vynta_priority_actions",
  "vynta_business_summary",
  "vynta_threat_analysis",
  "vynta_market_intelligence",
  "vynta_search_intelligence",
  "vynta_opportunities",
  "vynta_weakpoint_actions",
] as const;

// ── Early Warning System ──────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = { high: RED, medium: AMBER, low: "#7B5E45" };
const SEV_BG: Record<string, string>    = { high: "rgba(220,38,38,0.1)", medium: "rgba(196,135,74,0.12)", low: "rgba(255,255,255,0.07)" };
const BORDER_BY_TYPE: Record<string, string> = { warning: RED, positive: TEAL, info: AMBER };

function EarlyWarningSystem() {
  const [data,    setData]    = useState<EarlyWarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const cached = lsGet<EarlyWarningsResponse>("vynta_early_warnings", Infinity);
    if (cached) { setData(cached); setLoading(false); return; }
    runFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runFetch() {
    setLoading(true);
    setError(false);

    fetch("/api/intel/early-warnings")
      .then(r => r.json())
      .then((d: EarlyWarningsResponse & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        lsSet("vynta_early_warnings", d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  return (
    <div style={{ ...CARD, padding: "14px 16px", marginBottom: "12px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: loading ? 0 : "12px" }}>
        <svg viewBox="0 0 20 20" fill={RED} style={{ width: 14, height: 14, flexShrink: 0 }}>
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: DARK, flex: 1 }}>
          Early Warning System
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px" }}>
          <Skeleton height={56} />
          <Skeleton height={56} />
        </div>
      ) : error ? (
        <ErrorMsg msg="Unable to load early warnings — try refreshing" />
      ) : !data || data.insufficient_data ? (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px 14px" }}>
          <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.6 }}>
            Run at least 2 weekly sentiment analyses in Reports to enable early warnings.
          </p>
        </div>
      ) : data.warnings.length === 0 ? (
        <div style={{ background: "rgba(45,155,138,0.07)", border: "1px solid rgba(45,155,138,0.18)", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg viewBox="0 0 20 20" fill={TEAL} style={{ width: 14, height: 14, flexShrink: 0 }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          <p style={{ fontSize: "12px", color: TEAL, fontWeight: 600 }}>No emerging issues detected this week.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.warnings.map((w, i) => (
            <div
              key={i}
              style={{
                background: w.type === "warning"
                  ? "rgba(220,38,38,0.04)"
                  : w.type === "positive"
                    ? "rgba(45,155,138,0.05)"
                    : "rgba(196,135,74,0.06)",
                borderLeft: `3px solid ${BORDER_BY_TYPE[w.type] ?? AMBER}`,
                borderRadius: "10px",
                padding: "11px 13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: DARK, flex: 1 }}>{w.title}</p>
                <span style={{
                  fontSize: "8px", fontWeight: 800, padding: "2px 7px", borderRadius: "20px", flexShrink: 0,
                  background: SEV_BG[w.severity] ?? SEV_BG.low,
                  color: SEV_COLOR[w.severity] ?? SEV_COLOR.low,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  {w.severity}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "#5C3D1E", lineHeight: 1.55, marginBottom: "7px" }}>{w.detail}</p>
              <p style={{ fontSize: "11px", color: AMBER, fontWeight: 600, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>→ Action:</span> {w.action}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Priority Actions ──────────────────────────────────────────────────────────

function PriorityActions({
  reviews, sentimentData, competitors, userRating, userTotalReviews,
}: {
  reviews: SlimReview[];
  sentimentData: SentimentAnalysis | null;
  competitors: Competitor[];
  userRating: number | null;
  userTotalReviews: number | null;
}) {
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = lsGet<string[]>("vynta_priority_actions", Infinity);
    if (cached) { setActions(cached); setLoading(false); return; }
    if (reviews.length === 0) { setLoading(false); return; }

    const avgRating = reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    const compStr = competitors.length > 0
      ? competitors.map(c => `${c.name}: ${c.rating}★, trend: ${c.trend ?? "unknown"}`).join("; ")
      : "No competitors tracked";

    const complaintStr = sentimentData?.complaintThemes?.map(t => t.theme).join(", ") || "none";
    const unresponded = reviews.filter(r => !r.responded).length;

    const totalCount = userTotalReviews ?? reviews.length;
    const system = "You are a reputation intelligence engine. Return ONLY a JSON array of exactly 3 strings — no markdown, no keys, just the raw array.";
    const msg = `My business: ${totalCount} total Google reviews (${reviews.length} imported for analysis), avg rating ${avgRating ?? "unknown"}★ (user-provided: ${userRating ?? avgRating ?? "unknown"}★).
Top complaint themes: ${complaintStr}.
Unresponded reviews: ${unresponded}.
Competitors: ${compStr}.

Return a JSON array of exactly 3 short, specific, actionable priority actions ranked by impact. Reference real data: competitor names, complaint themes, real numbers. Max 20 words each. No generic advice.`;

    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
    })
      .then(r => r.json())
      .then((d: { response?: string }) => {
        const raw = (d.response ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("no array");
        const parsed = JSON.parse(match[0]) as string[];
        const trimmed = parsed.slice(0, 3);
        setActions(trimmed);
        lsSet("vynta_priority_actions", trimmed);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews.length, competitors.length]);

  if (!loading && actions.length === 0 && !error) return null;

  return (
    <div style={{ ...CARD, padding: "14px 16px", marginBottom: "12px", borderLeft: `3px solid ${TEAL}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: loading || error ? 0 : "10px" }}>
        <svg viewBox="0 0 20 20" fill={AMBER} style={{ width: 14, height: 14 }}>
          <path fillRule="evenodd" d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" clipRule="evenodd" />
        </svg>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: DARK }}>
          This Week&apos;s Priorities
        </p>
        <span style={{ marginLeft: "auto", fontSize: "9px", color: MUTED }}>AI</span>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: "6px", alignItems: "center", paddingTop: "6px" }}>
          <SpinIcon size={11} />
          <span style={{ fontSize: "11px", color: MUTED }}>Calculating priorities…</span>
        </div>
      ) : error ? (
        <ErrorMsg msg="Unable to generate priorities" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {actions.map((action, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{
                width: "18px", height: "18px", borderRadius: "50%",
                background: i === 0 ? TEAL : i === 1 ? AMBER : "rgba(255,255,255,0.1)",
                color: i < 2 ? "white" : DARK,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: "9px", fontWeight: 700, marginTop: "1px",
              }}>{i + 1}</span>
              <span style={{ fontSize: "12px", color: DARK, lineHeight: 1.5 }}>{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: My Business ──────────────────────────────────────────────────────────

function MyBusinessTab({
  reviews, sentimentHistory, sentimentData, userTotalReviews,
}: {
  reviews: SlimReview[];
  sentimentHistory: SentimentHistoryRecord[];
  sentimentData: SentimentAnalysis | null;
  userTotalReviews: number | null;
}) {
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    const cached = lsGet<string>("vynta_business_summary", Infinity);
    if (cached) { setSummary(cached); setSummaryLoading(false); return; }
    if (reviews.length === 0) { setSummaryLoading(false); return; }

    const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    const complaints = sentimentData?.complaintThemes?.map(t => t.theme).join(", ") || "none";
    const praise = sentimentData?.praiseThemes?.join(", ") || "none";
    const trend = sentimentData?.trending ?? "stable";
    const totalCount = userTotalReviews ?? reviews.length;

    const system = "You are a reputation analyst for local businesses. Write exactly 3-4 sentences: the current state of this business's reputation and the single most important thing to focus on. Plain text only — no bullet points, no markdown.";
    const msg = `${totalCount} total Google reviews (${reviews.length} analyzed), avg rating ${avgRating}★, sentiment trend: ${trend}. Top complaints: ${complaints}. Top praise: ${praise}.`;

    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
    })
      .then(r => r.json())
      .then((d: { response?: string }) => {
        const text = d.response?.trim() ?? "";
        setSummary(text);
        if (text) lsSet("vynta_business_summary", text);
      })
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews.length]);

  const weeks = buildWeekBuckets(reviews, 8);
  const ratingLabels = weeks.map(w => w.label);
  const ratingValues = weeks.map(w => w.avgRating ?? 0);
  const countValues  = weeks.map(w => w.count);

  const histRecords = [...sentimentHistory].reverse().slice(0, 8);
  const sentLabels  = histRecords.map(r =>
    new Date(r.weekStart + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Rating Over Time + Review Velocity — side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ ...CARD, padding: "12px" }}>
          <SectionLabel>Rating Over Time</SectionLabel>
          {reviews.length === 0 ? <ErrorMsg msg="No reviews yet" /> : (
            <div style={{ position: "relative", height: "160px" }}>
              <Line
                data={{
                  labels: ratingLabels,
                  datasets: [{
                    label: "Avg Rating",
                    data: ratingValues,
                    borderColor: TEAL,
                    backgroundColor: "rgba(45,155,138,0.08)",
                    pointBackgroundColor: TEAL,
                    pointRadius: 3,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                  }],
                }}
                options={lineOpts()}
              />
            </div>
          )}
        </div>

        <div style={{ ...CARD, padding: "12px" }}>
          <SectionLabel>Review Velocity</SectionLabel>
          {reviews.length === 0 ? <ErrorMsg msg="No reviews yet" /> : (
            <div style={{ position: "relative", height: "160px" }}>
              <Bar
                data={{
                  labels: ratingLabels,
                  datasets: [{
                    label: "Reviews",
                    data: countValues,
                    backgroundColor: AMBER,
                    borderRadius: 4,
                  }],
                }}
                options={barOpts()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sentiment Trend — full width */}
      <div style={{ ...CARD, padding: "12px" }}>
        <SectionLabel>Sentiment Trend</SectionLabel>
        {histRecords.length === 0 ? (
          <ErrorMsg msg="Run a sentiment analysis in Reports to populate this chart" />
        ) : (
          <div style={{ position: "relative", height: "160px" }}>
            <Bar
              data={{
                labels: sentLabels,
                datasets: [
                  { label: "Positive", data: histRecords.map(r => r.data.positive ?? 0), backgroundColor: TEAL,  borderRadius: 2 },
                  { label: "Neutral",  data: histRecords.map(r => r.data.neutral  ?? 0), backgroundColor: AMBER, borderRadius: 2 },
                  { label: "Negative", data: histRecords.map(r => r.data.negative ?? 0), backgroundColor: RED,   borderRadius: 2 },
                ],
              }}
              options={barOpts(true)}
            />
          </div>
        )}
      </div>

      {/* Top themes */}
      {sentimentData && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div style={{ ...CARD, padding: "14px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C0392B", marginBottom: "10px" }}>
              Top Complaints
            </p>
            {(sentimentData.complaintThemes ?? []).length === 0 ? (
              <p style={{ fontSize: "11px", color: MUTED }}>None detected</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {(sentimentData.complaintThemes ?? []).map(t => (
                  <div key={t.theme} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: DARK, fontWeight: 500, lineHeight: 1.3 }}>{t.theme}</span>
                    <span style={{
                      fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", flexShrink: 0,
                      background: t.severity === "high" ? "rgba(192,57,43,0.1)" : t.severity === "medium" ? "rgba(196,135,74,0.1)" : "rgba(255,255,255,0.07)",
                      color: t.severity === "high" ? "#C0392B" : t.severity === "medium" ? AMBER : "#7B5E45",
                    }}>{t.severity.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ ...CARD, padding: "14px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEAL, marginBottom: "10px" }}>
              Top Praise
            </p>
            {(sentimentData.praiseThemes ?? []).length === 0 ? (
              <p style={{ fontSize: "11px", color: MUTED }}>None detected</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {(sentimentData.praiseThemes ?? []).map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: DARK, fontWeight: 500 }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Business Summary */}
      <div style={{
        background: "#120804",
        border: "1px solid rgba(45,155,138,0.16)",
        borderRadius: "16px",
        padding: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <svg viewBox="0 0 20 20" fill={TEAL} style={{ width: 14, height: 14 }}>
            <path fillRule="evenodd" d="M11 3a1 1 0 1 0-2 0v1a1 1 0 1 0 2 0V3ZM6.22 5.22a1 1 0 0 0-1.42 1.42l.7.7a1 1 0 1 0 1.42-1.42l-.7-.7Zm8.02 1.42a1 1 0 0 0-1.42-1.42l-.7.7a1 1 0 1 0 1.42 1.42l.7-.7ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-7 3a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H3Zm14 0a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2h-1Z" clipRule="evenodd" />
          </svg>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEAL }}>
            AI Business Summary
          </p>
        </div>
        {summaryLoading ? (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <SpinIcon size={12} />
            <span style={{ fontSize: "11px", color: MUTED }}>Analysing your reputation…</span>
          </div>
        ) : summary ? (
          <p style={{ fontSize: "13px", color: DARK, lineHeight: 1.7 }}>{summary}</p>
        ) : (
          <ErrorMsg msg="Import reviews to generate your business summary" />
        )}
      </div>
    </div>
  );
}

// ── Tab: Competitors ──────────────────────────────────────────────────────────

function CompetitorsTab({
  competitors, userRating, userReviewCount,
}: {
  competitors: Competitor[];
  userRating: number | null;
  userReviewCount: number;
}) {
  const [threat, setThreat] = useState<ThreatAnalysis | null>(null);
  const [threatLoading, setThreatLoading] = useState(false);
  const [threatError, setThreatError] = useState(false);

  const [weakpointActions, setWeakpointActions] = useState<WeakpointAction[] | null>(null);
  const [weakpointLoading, setWeakpointLoading] = useState(false);
  const [weakpointError, setWeakpointError]   = useState(false);

  useEffect(() => {
    const cached = lsGet<ThreatAnalysis>("vynta_threat_analysis", Infinity);
    if (cached) { setThreat(cached); return; }
    if (competitors.length > 0) runThreat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitors.length]);

  useEffect(() => {
    const cached = lsGet<WeakpointAction[]>("vynta_weakpoint_actions", Infinity);
    if (cached) { setWeakpointActions(cached); return; }
    if (competitors.length > 0) runWeakpoints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitors.length]);

  function runThreat() {
    if (competitors.length === 0) return;
    setThreatLoading(true);
    setThreatError(false);

    const compStr = competitors.map(c => {
      const a = parseAnalysis(c.analysisText);
      const s = parseSentiment(c.sentiment);
      return `${c.name}: ${c.rating}★, ${c.reviewCount} reviews, trend: ${c.trend ?? "unknown"}, ${s.positive}% positive. Strengths: ${(a.strengths ?? []).join(", ") || "unknown"}. Weaknesses: ${(a.weaknesses ?? []).join(", ") || "unknown"}.`;
    }).join("\n");

    const system = "You are a competitive intelligence analyst for local businesses. Return ONLY a raw JSON object — no markdown, no backticks.";
    const msg = `My business: real Google review count: ${userReviewCount}, rating: ${userRating ?? "unknown"}★.
Competitors:
${compStr}

Return exactly this JSON:
{
  "biggestThreat": "<which competitor is the biggest threat and exactly why — 1-2 sentences, name them>",
  "beatingUser": "<where competitors are beating me — 1-2 sentences, be specific with names>",
  "userBeating": "<where I am beating competitors — 1-2 sentences>",
  "actions": ["<specific action 1>", "<specific action 2>", "<specific action 3>"]
}`;

    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
    })
      .then(r => r.json())
      .then((d: { response?: string }) => {
        const raw = (d.response ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("no json");
        const parsed = JSON.parse(match[0]) as ThreatAnalysis;
        setThreat(parsed);
        lsSet("vynta_threat_analysis", parsed);
      })
      .catch(() => setThreatError(true))
      .finally(() => setThreatLoading(false));
  }

  function runWeakpoints() {
    if (competitors.length === 0) return;
    setWeakpointLoading(true);
    setWeakpointError(false);

    const compWeaknesses = competitors
      .map(c => {
        const a = parseAnalysis(c.analysisText);
        const s = parseSentiment(c.sentiment);
        const weaknesses = (a.weaknesses ?? []).join("; ") || "unknown";
        return `${c.name} (${c.rating}★, ${s.negative}% negative reviews): complaints include — ${weaknesses}`;
      })
      .join("\n");

    const system = "You are a competitive intelligence analyst for local businesses. Return ONLY a raw JSON array — no markdown, no backticks, no explanation.";
    const msg = `These are your client's local competitors and what customers are complaining about at each one:\n\n${compWeaknesses}\n\nIdentify the 4-6 most impactful weaknesses across these competitors and for each one write a specific "take action" item the client can execute to steal those customers.\n\nReturn exactly this JSON array:\n[\n  {\n    "weakness": "<the specific thing customers are complaining about at competitors — e.g. Long wait times, Rude staff, Poor communication>",\n    "competitors": "<which competitors have this problem — names only, e.g. Rival A & Rival B>",\n    "action": "<concrete specific thing the client should do to exploit this — 1 sentence, starts with a verb>",\n    "howToWin": "<why this specific action will win those unhappy customers — 1 sentence>"\n  }\n]\n\nBe specific. Name competitors. Use real complaint themes. Do not fabricate issues not present in the data.`;

    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
    })
      .then(r => r.json())
      .then((d: { response?: string }) => {
        const raw = (d.response ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("no json");
        const parsed = JSON.parse(match[0]) as WeakpointAction[];
        setWeakpointActions(parsed);
        lsSet("vynta_weakpoint_actions", parsed);
      })
      .catch(() => setWeakpointError(true))
      .finally(() => setWeakpointLoading(false));
  }

  if (competitors.length === 0) {
    return (
      <div style={{ ...CARD, padding: "28px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.6 }}>
          Add competitors in the Rivals tab to unlock competitor intelligence.
        </p>
      </div>
    );
  }

  const allNames    = ["You", ...competitors.map(c => c.name.split(" ")[0])];
  const allRatings  = [userRating ?? 0, ...competitors.map(c => c.rating)];
  const allVelocity = [0, ...competitors.map(c => parseVelocity(c.velocity))];
  const barColors   = [TEAL, ...competitors.map((_, i) => COMP_COLORS[i % COMP_COLORS.length])];

  const ratingBarOpts = {
    ...barOpts(),
    scales: { ...barOpts().scales, y: { ...barOpts().scales.y, min: 3.0, max: 5, beginAtZero: false } },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Rating comparison */}
      <div style={{ ...CARD, padding: "12px" }}>
        <SectionLabel>Rating Comparison</SectionLabel>
        <div style={{ position: "relative", height: "160px" }}>
          <Bar
            data={{
              labels: allNames,
              datasets: [{ label: "Rating", data: allRatings, backgroundColor: barColors, borderRadius: 6 }],
            }}
            options={ratingBarOpts}
          />
        </div>
      </div>

      {/* Velocity comparison */}
      <div style={{ ...CARD, padding: "12px" }}>
        <SectionLabel>Review Velocity (reviews/month)</SectionLabel>
        <div style={{ position: "relative", height: "160px" }}>
          <Bar
            data={{
              labels: allNames,
              datasets: [{ label: "Reviews/month", data: allVelocity, backgroundColor: barColors, borderRadius: 6 }],
            }}
            options={barOpts()}
          />
        </div>
      </div>

      {/* Threat Analysis */}
      <div style={{ ...CARD, padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <SectionLabel>Threat Analysis</SectionLabel>
        </div>

        {threatLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={80} />
          </div>
        ) : threatError ? (
          <ErrorMsg msg="Unable to generate threat analysis — try refreshing" />
        ) : threat ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {([
              { label: "Biggest Threat",      value: threat.biggestThreat, color: RED,   bg: "rgba(220,38,38,0.06)"    },
              { label: "Where They Beat You", value: threat.beatingUser,   color: AMBER, bg: "rgba(196,135,74,0.08)"   },
              { label: "Where You Win",       value: threat.userBeating,   color: TEAL,  bg: "rgba(45,155,138,0.06)"   },
            ] as const).map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: "12px", padding: "12px 14px", borderLeft: `3px solid ${color}` }}>
                <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color, marginBottom: "5px" }}>{label}</p>
                <p style={{ fontSize: "12px", color: DARK, lineHeight: 1.55 }}>{value}</p>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: "10px" }}>
                Recommended Actions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(threat.actions ?? []).map((action, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{
                      width: "18px", height: "18px", borderRadius: "50%", background: AMBER,
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: "9px", fontWeight: 700,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: "12px", color: DARK, lineHeight: 1.5 }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={runThreat}
            style={{
              width: "100%", background: "#2D9B8A", color: "white", borderRadius: "10px",
              padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
            }}
          >
            Generate Threat Analysis
          </button>
        )}
      </div>

      {/* ── Competitor Weakpoints ── */}
      <div style={{ ...CARD, padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <svg viewBox="0 0 20 20" fill={RED} style={{ width: 13, height: 13, flexShrink: 0 }}>
            <path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.174L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8Zm11 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8ZM5.05 11.05a.75.75 0 0 1 1.06 1.061L5.049 13.172a.75.75 0 0 1-1.06-1.06l1.06-1.062Zm9.9 0l1.06 1.061a.75.75 0 1 1-1.06 1.062l-1.062-1.06a.75.75 0 0 1 1.061-1.063ZM10 14a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 14Z" clipRule="evenodd" />
          </svg>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: DARK }}>
            Competitor Weakpoints
          </p>
        </div>

        {/* Weakness cards per competitor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {competitors.map((comp, i) => {
            const a = parseAnalysis(comp.analysisText);
            const s = parseSentiment(comp.sentiment);
            const weaknesses = a.weaknesses ?? [];
            if (weaknesses.length === 0) return null;
            return (
              <div key={comp.id} style={{
                background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)",
                borderRadius: "12px", padding: "12px 14px",
                borderLeft: `3px solid ${COMP_COLORS[i % COMP_COLORS.length]}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: DARK }}>{comp.name}</span>
                    <span style={{ fontSize: "11px", color: MUTED }}>{comp.rating}★</span>
                  </div>
                  {s.negative > 0 && (
                    <span style={{
                      fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px",
                      background: s.negative >= 20 ? "rgba(220,38,38,0.12)" : "rgba(196,135,74,0.1)",
                      color: s.negative >= 20 ? RED : AMBER,
                    }}>
                      {s.negative}% negative
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {weaknesses.slice(0, 4).map((w, wi) => (
                    <div key={wi} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ color: RED, fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>✕</span>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Common complaints across competitors */}
        {(() => {
          const allWeaknesses = competitors.flatMap(c => parseAnalysis(c.analysisText).weaknesses ?? []);
          const freq: Record<string, number> = {};
          for (const w of allWeaknesses) {
            const key = w.toLowerCase().trim();
            freq[key] = (freq[key] ?? 0) + 1;
          }
          const recurring = Object.entries(freq)
            .filter(([, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          if (recurring.length === 0) return null;
          return (
            <div style={{ background: "rgba(196,135,74,0.06)", border: "1px solid rgba(196,135,74,0.15)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: AMBER, marginBottom: "10px" }}>
                🎯 Market-Wide Complaints
              </p>
              <p style={{ fontSize: "10px", color: MUTED, marginBottom: "10px", lineHeight: 1.5 }}>
                These issues appear at {recurring[0][1]}+ competitors — the biggest opportunities for you to stand out:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recurring.map(([weakness, count]) => (
                  <div key={weakness} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "rgba(196,135,74,0.12)", color: AMBER, flexShrink: 0 }}>
                      {count} rivals
                    </span>
                    <span style={{ fontSize: "11px", color: DARK, lineHeight: 1.4, textTransform: "capitalize" }}>{weakness}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Take Action */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEAL, marginBottom: "12px" }}>
            Take Action
          </p>

          {weakpointLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </div>
          ) : weakpointError ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <ErrorMsg msg="Unable to generate action items — try refreshing" />
              <button type="button" onClick={runWeakpoints}
                style={{ background: "none", border: "1px solid rgba(45,155,138,0.3)", borderRadius: "8px", padding: "8px", fontSize: "12px", color: TEAL, cursor: "pointer" }}>
                Retry
              </button>
            </div>
          ) : weakpointActions && weakpointActions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {weakpointActions.map((item, i) => (
                <div key={i} style={{ background: "rgba(45,155,138,0.05)", border: "1px solid rgba(45,155,138,0.15)", borderRadius: "12px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                    <span style={{
                      width: "18px", height: "18px", borderRadius: "50%", background: TEAL,
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: "9px", fontWeight: 700, marginTop: "1px",
                    }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: RED }}>{item.weakness}</span>
                        <span style={{ fontSize: "9px", color: MUTED }}>@ {item.competitors}</span>
                      </div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: DARK, lineHeight: 1.5, marginBottom: "4px" }}>{item.action}</p>
                      <p style={{ fontSize: "10px", color: MUTED, lineHeight: 1.5 }}>→ {item.howToWin}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={runWeakpoints}
              style={{
                width: "100%", background: TEAL, color: "white", borderRadius: "10px",
                padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
              }}
            >
              Generate Action Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Market ───────────────────────────────────────────────────────────────

function MarketTab({
  competitors, userRating, sentimentData, businessType, businessName, businessAddress,
}: {
  competitors: Competitor[];
  userRating: number | null;
  sentimentData: SentimentAnalysis | null;
  businessType: string;
  businessName: string;
  businessAddress: string;
}) {
  const [intel, setIntel] = useState<MarketIntel | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelError, setIntelError] = useState(false);

  const [searchIntel, setSearchIntel] = useState<SearchIntelligence | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    const cached = lsGet<MarketIntel>("vynta_market_intelligence", Infinity);
    if (cached) { setIntel(cached); return; }
    if (competitors.length > 0) runIntel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitors.length]);

  useEffect(() => {
    const cached = lsGet<SearchIntelligence>("vynta_search_intelligence", Infinity);
    if (cached) { setSearchIntel(cached); return; }
    if (businessAddress && competitors.length > 0) runSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessAddress, competitors.length]);

  function runIntel() {
    setIntelLoading(true);
    setIntelError(false);

    const compStr = competitors.map(c => {
      const s = parseSentiment(c.sentiment);
      return `${c.name}: ${c.rating}★, ${c.reviewCount} reviews, ${s.positive}% positive`;
    }).join("; ");

    const userSent = sentimentData ? `${sentimentData.positive}% positive` : "unknown";

    const system = "You are a market intelligence analyst. Return ONLY a raw JSON object — no markdown, no backticks.";
    const msg = `Business type: ${businessType || "local business"}. My rating: ${userRating ?? "unknown"}★, my sentiment: ${userSent}.
Market competitors: ${compStr}.

Return exactly this JSON:
{
  "emergingThemes": ["<theme 1>", "<theme 2>", "<theme 3>"],
  "opportunityGap": "<biggest opportunity gap the user can exploit — 1-2 specific sentences>",
  "whatTopBusinessesDo": "<what top-rated businesses in this market do that lower-rated ones don't — 1-2 sentences>"
}`;

    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
    })
      .then(r => r.json())
      .then((d: { response?: string }) => {
        const raw = (d.response ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("no json");
        const parsed = JSON.parse(match[0]) as MarketIntel;
        setIntel(parsed);
        lsSet("vynta_market_intelligence", parsed);
      })
      .catch(() => setIntelError(true))
      .finally(() => setIntelLoading(false));
  }

  function runSearch() {
    if (!businessAddress) return;
    setSearchLoading(true);
    setSearchError(false);

    fetch("/api/intel/market-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        businessType,
        businessAddress,
        competitors: competitors.slice(0, 3).map(c => ({ name: c.name, zipCode: c.zipCode ?? "" })),
      }),
    })
      .then(r => r.json())
      .then((d: SearchIntelligence & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setSearchIntel(d);
        lsSet("vynta_search_intelligence", d);
      })
      .catch(() => setSearchError(true))
      .finally(() => setSearchLoading(false));
  }

  if (competitors.length === 0) {
    return (
      <div style={{ ...CARD, padding: "28px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.6 }}>
          Add competitors in the Rivals tab to unlock market intelligence.
        </p>
      </div>
    );
  }

  const marketAvgRating = parseFloat(
    (competitors.reduce((s, c) => s + c.rating, 0) / competitors.length).toFixed(1)
  );
  const marketAvgPositive = Math.round(
    competitors.reduce((s, c) => s + parseSentiment(c.sentiment).positive, 0) / competitors.length
  );
  const userPositive = sentimentData?.positive ?? null;
  const ratingDelta = userRating !== null ? userRating - marketAvgRating : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* You vs Market Average */}
      <div style={{ ...CARD, padding: "16px" }}>
        <SectionLabel>You vs Market Average</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: ratingDelta !== null ? "12px" : 0 }}>
          <div style={{ textAlign: "center", padding: "14px 10px", background: "rgba(45,155,138,0.07)", borderRadius: "12px" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: TEAL, lineHeight: 1 }}>{userRating?.toFixed(1) ?? "—"}</p>
            <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginTop: "4px" }}>Your Rating</p>
          </div>
          <div style={{ textAlign: "center", padding: "14px 10px", background: "rgba(255,255,255,0.04)", borderRadius: "12px" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: DARK, lineHeight: 1 }}>{marketAvgRating.toFixed(1)}</p>
            <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginTop: "4px" }}>Market Avg</p>
          </div>
        </div>
        {ratingDelta !== null && (
          <p style={{ fontSize: "12px", color: ratingDelta >= 0 ? TEAL : RED, textAlign: "center", fontWeight: 700 }}>
            {ratingDelta >= 0
              ? `${ratingDelta.toFixed(1)}★ above market average`
              : `${Math.abs(ratingDelta).toFixed(1)}★ below market average`}
          </p>
        )}
      </div>

      {/* Market Sentiment Overview */}
      {userPositive !== null && (
        <div style={{ ...CARD, padding: "16px" }}>
          <SectionLabel>Market Sentiment Overview</SectionLabel>
          {([
            { label: "Your Positive %",      value: userPositive,      color: TEAL },
            { label: "Market Avg Positive %", value: marketAvgPositive, color: MUTED },
          ] as const).map(({ label, value, color }) => (
            <div key={label} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", color: DARK, fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color }}>{value}%</span>
              </div>
              <div style={{ height: "8px", borderRadius: "99px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: "99px", transition: "width 600ms" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Market Intelligence */}
      <div style={{ ...CARD, padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <SectionLabel>Market Intelligence</SectionLabel>
        </div>
        {intelLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton height={36} />
            <Skeleton height={60} />
            <Skeleton height={60} />
          </div>
        ) : intelError ? (
          <ErrorMsg msg="Unable to generate market intelligence — try refreshing" />
        ) : intel ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEAL, marginBottom: "8px" }}>
                Emerging Market Themes
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {intel.emergingThemes.map((t, i) => (
                  <span key={i} style={{ background: "rgba(45,155,138,0.1)", color: TEAL, borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(196,135,74,0.08)", borderRadius: "12px", padding: "12px 14px", borderLeft: `3px solid ${AMBER}` }}>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: AMBER, marginBottom: "5px" }}>Opportunity Gap</p>
              <p style={{ fontSize: "12px", color: DARK, lineHeight: 1.55 }}>{intel.opportunityGap}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px 14px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7B5E45", marginBottom: "5px" }}>What Top Businesses Do</p>
              <p style={{ fontSize: "12px", color: DARK, lineHeight: 1.55 }}>{intel.whatTopBusinessesDo}</p>
            </div>
          </div>
        ) : (
          <button type="button" onClick={runIntel} style={{ width: "100%", background: "#2D9B8A", color: "white", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            Generate Market Intelligence
          </button>
        )}
      </div>

      {/* ── Search Intelligence ───────────────────────────────────────────────── */}
      <div style={{ ...CARD, padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
          <svg viewBox="0 0 20 20" fill={TEAL} style={{ width: 14, height: 14 }}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: DARK }}>
            Search Intelligence
          </p>
        </div>

        {searchLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={70} />
            <Skeleton height={70} />
          </div>
        ) : searchError ? (
          <ErrorMsg msg="Unable to load search intelligence — try refreshing" />
        ) : searchIntel ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* 1. Search Visibility */}
            <div style={{ background: "rgba(45,155,138,0.05)", border: "1px solid rgba(45,155,138,0.14)", borderRadius: "12px", padding: "13px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEAL }}>Search Visibility</p>
                <span style={{ background: "rgba(45,155,138,0.12)", color: TEAL, borderRadius: "20px", padding: "2px 9px", fontSize: "10px", fontWeight: 700 }}>
                  {searchIntel.searchVisibility.rank}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: DARK, lineHeight: 1.55, marginBottom: "10px" }}>
                {searchIntel.searchVisibility.summary}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {searchIntel.searchVisibility.insights.map((insight, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0, fontSize: "12px", marginTop: "1px" }}>→</span>
                    <span style={{ fontSize: "11px", color: DARK, lineHeight: 1.5 }}>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Market Position */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "13px 14px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: "10px" }}>Market Position</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "12px" }}>
                {searchIntel.marketPosition.topPlayers.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#2D9B8A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px", fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ fontSize: "12px", color: DARK, lineHeight: 1.5 }}>
                      <strong>{p.name}</strong> — {p.note}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: AMBER, marginBottom: "7px" }}>Opportunities</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {searchIntel.marketPosition.opportunities.map((o, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ color: AMBER, fontWeight: 700, flexShrink: 0, fontSize: "12px", marginTop: "1px" }}>→</span>
                      <span style={{ fontSize: "11px", color: DARK, lineHeight: 1.5 }}>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Competitor Online Presence */}
            {searchIntel.competitorOnlinePresence.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "13px 14px" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: "10px" }}>Competitor Online Presence</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {searchIntel.competitorOnlinePresence.map((c, i) => (
                    <div key={i}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: DARK, marginBottom: "3px" }}>{c.name}</p>
                      <p style={{ fontSize: "11px", color: "#7B5E45", lineHeight: 1.5, marginBottom: "7px" }}>{c.searchSummary}</p>
                      <div style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderLeft: `3px solid ${RED}`, borderRadius: "8px", padding: "8px 10px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: RED, marginBottom: "3px" }}>Vulnerability</p>
                        <p style={{ fontSize: "11px", color: DARK, lineHeight: 1.5 }}>{c.vulnerability}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Market Trends */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "13px 14px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: "10px" }}>Market Trends</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                {searchIntel.marketTrends.emerging.map((t, i) => (
                  <span key={i} style={{ background: "rgba(45,155,138,0.1)", color: TEAL, borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <div style={{ background: "rgba(196,135,74,0.1)", borderLeft: `3px solid ${AMBER}`, borderRadius: "8px", padding: "10px 12px" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: AMBER, marginBottom: "4px" }}>Recommended Action</p>
                <p style={{ fontSize: "12px", fontWeight: 700, color: DARK, lineHeight: 1.55 }}>{searchIntel.marketTrends.recommendation}</p>
              </div>
            </div>

          </div>
        ) : businessAddress ? (
          <button type="button" onClick={runSearch} style={{ width: "100%", background: "#2D9B8A", color: "white", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            Run Search Intelligence
          </button>
        ) : (
          <ErrorMsg msg="Add your business address in Settings to enable search intelligence" />
        )}
      </div>

    </div>
  );
}

// ── Tab: Opportunities ───────────────────────────────────────────────────────

function OpportunitiesTab({
  reviews, competitors, userRating, userTotalReviews, sentimentData, businessName, businessType,
}: {
  reviews: SlimReview[];
  competitors: Competitor[];
  userRating: number | null;
  userTotalReviews: number | null;
  sentimentData: SentimentAnalysis | null;
  businessName: string;
  businessType: string;
}) {
  const [data,    setData]    = useState<OpportunitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const cached = lsGet<OpportunitiesData>("vynta_opportunities", Infinity);
    if (cached) { setData(cached); setLoading(false); return; }
    if (reviews.length === 0) { setLoading(false); return; }
    runFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews.length, competitors.length]);

  function runFetch() {
    if (reviews.length === 0) return;
    setLoading(true);
    setError(false);

    const respondedCount = reviews.filter(r => r.responded).length;

    fetch("/api/intel/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        businessType,
        userRating: userRating ?? 0,
        userTotalReviews: userTotalReviews ?? reviews.length,
        competitors: competitors.map(c => ({
          name: c.name,
          rating: c.rating,
          reviewCount: c.reviewCount,
          sentiment: c.sentiment,
          velocity: c.velocity,
          analysisText: c.analysisText,
        })),
        sentimentData: sentimentData ? {
          positive: sentimentData.positive,
          negative: sentimentData.negative,
          trending: sentimentData.trending,
          complaintThemes: sentimentData.complaintThemes,
          praiseThemes: sentimentData.praiseThemes,
          actionableInsights: sentimentData.actionableInsights,
          executiveSummary: sentimentData.executiveSummary,
        } : null,
        respondedCount,
        totalImportedReviews: reviews.length,
      }),
    })
      .then(r => r.json())
      .then((d: OpportunitiesData & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        lsSet("vynta_opportunities", d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  if (!loading && reviews.length === 0) {
    return (
      <div style={{ ...CARD, padding: "28px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.6 }}>
          Import reviews to unlock opportunity analysis.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>


      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Skeleton height={130} />
          <Skeleton height={110} />
          <Skeleton height={110} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={90} />
        </div>
      ) : error ? (
        <div style={{ ...CARD, padding: "20px", textAlign: "center" }}>
          <ErrorMsg msg="Unable to generate opportunity analysis — try refreshing" />
          <button
            type="button"
            onClick={runFetch}
            style={{ marginTop: "10px", background: "#2D9B8A", color: "white", borderRadius: "10px", padding: "9px 18px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      ) : data ? (
        <>
          {/* ── SECTION 1: Revenue Opportunities ─────────────────────────── */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2C1A0E", marginBottom: "10px" }}>
              💰 Revenue Opportunities
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.revenueOpportunities.map((opp, i) => {
                const impactColor = opp.impact === "high" ? RED : opp.impact === "medium" ? AMBER : MUTED;
                const impactBg    = opp.impact === "high" ? "rgba(220,38,38,0.08)" : opp.impact === "medium" ? "rgba(196,135,74,0.08)" : "rgba(255,255,255,0.05)";
                return (
                  <div key={i} style={{ ...CARD, padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: DARK, flex: 1, lineHeight: 1.3 }}>{opp.title}</p>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, padding: "2px 7px", borderRadius: "20px", flexShrink: 0,
                        background: impactBg, color: impactColor,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>{opp.impact}</span>
                    </div>
                    <div style={{ background: "rgba(45,155,138,0.08)", border: "1px solid rgba(45,155,138,0.18)", borderRadius: "10px", padding: "10px 13px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "15px", fontWeight: 800, color: TEAL, lineHeight: 1.2 }}>{opp.estimatedValue}</p>
                    </div>
                    <p style={{ fontSize: "12px", color: "#5C3D1E", lineHeight: 1.6, marginBottom: "8px" }}>{opp.detail}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "11px", color: AMBER, fontWeight: 600 }}>
                        <span style={{ fontWeight: 700 }}>→ This Week:</span> {opp.action}
                      </p>
                      <span style={{ fontSize: "9px", color: MUTED, background: "rgba(255,255,255,0.07)", padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                        {opp.timeToImpact}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 2: Competitor Gaps ────────────────────────────────── */}
          {data.competitorGaps.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2C1A0E", marginBottom: "10px" }}>
                ⚔️ Competitor Gaps
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.competitorGaps.map((gap, i) => {
                  const urgencyColor = gap.urgency === "act now" ? RED : gap.urgency === "this month" ? AMBER : MUTED;
                  const urgencyBg    = gap.urgency === "act now" ? "rgba(220,38,38,0.08)" : gap.urgency === "this month" ? "rgba(196,135,74,0.08)" : "rgba(255,255,255,0.05)";
                  return (
                    <div key={i} style={{ ...CARD, padding: "14px", borderLeft: `3px solid ${AMBER}` }}>
                      <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEAL, marginBottom: "4px" }}>{gap.competitor}</p>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: DARK, flex: 1, lineHeight: 1.3 }}>{gap.title}</p>
                        <span style={{
                          fontSize: "8px", fontWeight: 800, padding: "2px 7px", borderRadius: "20px", flexShrink: 0, whiteSpace: "nowrap",
                          background: urgencyBg, color: urgencyColor,
                          textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>{gap.urgency}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "10px" }}>{gap.detail}</p>
                      <div style={{ background: "rgba(45,155,138,0.07)", border: "1px solid rgba(45,155,138,0.15)", borderRadius: "8px", padding: "9px 12px" }}>
                        <p style={{ fontSize: "11px", color: TEAL, fontWeight: 600, lineHeight: 1.5 }}>{gap.opportunity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SECTION 3: Quick Wins ─────────────────────────────────────── */}
          {data.quickWins.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2C1A0E", marginBottom: "10px" }}>
                ⚡ Quick Wins
              </p>
              <div style={{ ...CARD, padding: "14px 16px", display: "flex", flexDirection: "column", gap: "0" }}>
                {data.quickWins.map((win, i) => {
                  const effortColor = win.effort === "low" ? TEAL  : win.effort === "high" ? RED   : AMBER;
                  const effortBg    = win.effort === "low" ? "rgba(45,155,138,0.1)" : win.effort === "high" ? "rgba(220,38,38,0.08)" : "rgba(196,135,74,0.08)";
                  const impactColor = win.impact === "high" ? TEAL : win.impact === "low" ? MUTED : AMBER;
                  const impactBg    = win.impact === "high" ? "rgba(45,155,138,0.1)" : win.impact === "low" ? "rgba(255,255,255,0.05)" : "rgba(196,135,74,0.08)";
                  return (
                    <div
                      key={i}
                      style={{
                        paddingTop: i === 0 ? 0 : "13px",
                        paddingBottom: i < data.quickWins.length - 1 ? "13px" : 0,
                        borderBottom: i < data.quickWins.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: effortBg, color: effortColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          {win.effort} effort
                        </span>
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: impactBg, color: impactColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          {win.impact} impact
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: DARK, marginBottom: "4px", lineHeight: 1.4 }}>{win.action}</p>
                      <p style={{ fontSize: "11px", color: MUTED, lineHeight: 1.5 }}>{win.why}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

type IntelTab = "business" | "competitors" | "market" | "opportunities";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function IntelligenceScreen() {
  const [activeTab, setActiveTab] = useState<IntelTab>("business");

  const [reviews,          setReviews]          = useState<SlimReview[]>([]);
  const [sentimentHistory, setSentimentHistory] = useState<SentimentHistoryRecord[]>([]);
  const [sentimentData,    setSentimentData]    = useState<SentimentAnalysis | null>(null);
  const [competitors,      setCompetitors]      = useState<Competitor[]>([]);
  const [businessType,     setBusinessType]     = useState("local business");
  const [businessName,     setBusinessName]     = useState("");
  const [businessAddress,  setBusinessAddress]  = useState("");
  const [userTotalReviews, setUserTotalReviews] = useState<number | null>(null);
  const [googleRating,     setGoogleRating]     = useState<number | null>(null);
  const [loading,          setLoading]          = useState(true);

  const [refreshKey,  setRefreshKey]  = useState(0);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  // Revenue profile (from settings)
  const [revAvgValue,       setRevAvgValue]       = useState<number | null>(null);
  const [revMonthlyNew,     setRevMonthlyNew]     = useState<number | null>(null);
  const [revGooglePct,      setRevGooglePct]      = useState<number | null>(null);
  const [revTargetRating,   setRevTargetRating]   = useState<number | null>(null);
  const [revRepeat,         setRevRepeat]         = useState<number | null>(null);
  const [revMargin,         setRevMargin]         = useState<number | null>(null);

  // Intel cache snapshots for PDF enrichment
  const [intelPriorities,    setIntelPriorities]    = useState<string[] | null>(null);
  const [intelWarnings,      setIntelWarnings]      = useState<Warning[] | null>(null);
  const [intelSummary,       setIntelSummary]       = useState<string | null>(null);
  const [intelThreat,        setIntelThreat]        = useState<ThreatAnalysis | null>(null);
  const [intelMarket,        setIntelMarket]        = useState<MarketIntel | null>(null);
  const [intelOpportunities, setIntelOpportunities] = useState<OpportunitiesData | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vynta_intel_last_refresh");
      if (stored) setLastRefresh(parseInt(stored, 10));
    } catch {}
  }, []);

  useEffect(() => {
    function syncIntelCaches() {
      try {
        const prio = lsGet<string[]>("vynta_priority_actions", Infinity);
        if (prio) setIntelPriorities(prio);
        const warn = lsGet<EarlyWarningsResponse>("vynta_early_warnings", Infinity);
        if (warn?.warnings) setIntelWarnings(warn.warnings);
        const summ = lsGet<string>("vynta_business_summary", Infinity);
        if (summ) setIntelSummary(summ);
        const threat = lsGet<ThreatAnalysis>("vynta_threat_analysis", Infinity);
        if (threat) setIntelThreat(threat);
        const market = lsGet<MarketIntel>("vynta_market_intelligence", Infinity);
        if (market) setIntelMarket(market);
        const opps = lsGet<OpportunitiesData>("vynta_opportunities", Infinity);
        if (opps) setIntelOpportunities(opps);
      } catch {}
    }
    syncIntelCaches();
    const t = setTimeout(syncIntelCaches, 3500);
    return () => clearTimeout(t);
  }, [refreshKey]);

  function refreshAll() {
    INTEL_CACHE_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    const now = Date.now();
    try { localStorage.setItem("vynta_intel_last_refresh", String(now)); } catch {}
    setLastRefresh(now);
    setRefreshKey(k => k + 1);
  }

  const refreshAvailable = !lastRefresh || Date.now() - lastRefresh > SEVEN_DAYS;
  const nextRefreshDate  = lastRefresh
    ? new Date(lastRefresh + SEVEN_DAYS).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  useEffect(() => {
    Promise.all([
      fetch("/api/user/reviews?slim=true").then(r => r.json()).catch(() => []),
      fetch("/api/user/sentiment-history").then(r => r.json()).catch(() => []),
      fetch("/api/user/sentiment-cache").then(r => r.json()).catch(() => null),
      fetch("/api/user/competitors").then(r => r.json()).catch(() => []),
      fetch("/api/user/settings").then(r => r.json()).catch(() => ({})),
      fetch("/api/user/smart-inbox").then(r => r.json()).catch(() => null),
    ]).then(([revs, hist, sentCache, comps, settings, inbox]) => {
      if (Array.isArray(revs))  setReviews(revs as SlimReview[]);
      if (Array.isArray(hist))  setSentimentHistory(hist as SentimentHistoryRecord[]);
      if (sentCache?.data)      setSentimentData(sentCache.data as SentimentAnalysis);
      if (Array.isArray(comps)) setCompetitors(comps as Competitor[]);
      const s = settings as {
        businessType?: string; businessName?: string; businessAddress?: string; googleRating?: number;
        avgCustomerValue?: number | null; monthlyNewCustomers?: number | null;
        googleTrafficPercent?: number | null; targetRating?: number | null;
        repeatCustomersPerYear?: number | null; grossMarginPercent?: number | null;
      };
      if (s.businessType) setBusinessType(s.businessType);
      if (s.businessName) setBusinessName(s.businessName);
      if (s.businessAddress) setBusinessAddress(s.businessAddress);
      if (s.googleRating && s.googleRating > 0) setGoogleRating(s.googleRating);
      if (s.avgCustomerValue)       setRevAvgValue(s.avgCustomerValue);
      if (s.monthlyNewCustomers)    setRevMonthlyNew(s.monthlyNewCustomers);
      if (s.googleTrafficPercent)   setRevGooglePct(s.googleTrafficPercent);
      if (s.targetRating)           setRevTargetRating(s.targetRating);
      if (s.repeatCustomersPerYear) setRevRepeat(s.repeatCustomersPerYear);
      if (s.grossMarginPercent)     setRevMargin(s.grossMarginPercent);
      const inboxData = inbox as { lastKnownCount?: number } | null;
      if (inboxData?.lastKnownCount) setUserTotalReviews(inboxData.lastKnownCount);
    }).finally(() => setLoading(false));
  }, []);

  const userRating = googleRating ??
    (reviews.length > 0
      ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
      : null);

  const TABS: { key: IntelTab; label: string }[] = [
    { key: "business",      label: "My Business"   },
    { key: "competitors",   label: "Competitors"   },
    { key: "market",        label: "Market"        },
    { key: "opportunities", label: "Opportunities" },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div style={{ padding: "28px 24px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1 }}>
              Intelligence
            </h1>
            <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "4px" }}>Your reputation command center</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            {!loading && sentimentData && businessName && (
              <DownloadReportButton
                data={{
                  businessName,
                  rating: userRating,
                  totalReviews: userTotalReviews,
                  positive: sentimentData.positive,
                  trending: sentimentData.trending,
                  praiseThemes: sentimentData.praiseThemes,
                  complaintThemes: sentimentData.complaintThemes,
                  topAction: null,
                  competitors: competitors.slice(0, 5).map(c => ({ name: c.name, rating: c.rating, reviewCount: c.reviewCount })),
                  isProspect: false,
                  generatedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                  businessSummary:       intelSummary       ?? undefined,
                  priorityActions:       intelPriorities    ?? undefined,
                  earlyWarnings:         intelWarnings      ?? undefined,
                  threatAnalysis:        intelThreat        ?? undefined,
                  marketIntel:           intelMarket        ?? undefined,
                  revenueOpportunities:  intelOpportunities?.revenueOpportunities,
                  competitorGaps:        intelOpportunities?.competitorGaps,
                  quickWins:             intelOpportunities?.quickWins,
                  risks:                 sentimentData.risks,
                  operationalRecs:       sentimentData.operationalRecommendations,
                } satisfies PDFReportData}
                label="↓ Download Report"
                style={{ fontSize: "12px", padding: "8px 14px" }}
              />
            )}
            {!loading && (
              refreshAvailable ? (
                <button
                  type="button"
                  onClick={refreshAll}
                  style={{
                    background: "rgba(45,155,138,0.12)",
                    color: TEAL,
                    border: "1px solid rgba(45,155,138,0.25)",
                    borderRadius: "10px",
                    padding: "7px 13px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ↺ Refresh Intelligence
                </button>
              ) : (
                <p style={{ fontSize: "10px", color: MUTED, textAlign: "right" }}>
                  Next refresh {nextRefreshDate}
                </p>
              )
            )}
          </div>
        </div>

        {/* Priority Actions — always visible */}
        <PriorityActions
          key={`pa-${refreshKey}`}
          reviews={reviews}
          sentimentData={sentimentData}
          competitors={competitors}
          userRating={userRating}
          userTotalReviews={userTotalReviews}
        />

        {/* Early Warning System — always visible */}
        <EarlyWarningSystem key={`ews-${refreshKey}`} />

        {/* Revenue Intelligence — always visible */}
        {(() => {
          const unrespondedCount = reviews.filter(r => !r.responded).length;
          if (!revAvgValue) {
            return (
              <div style={{ ...CARD, padding: "14px 16px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: DARK, marginBottom: "2px" }}>Revenue at Risk</p>
                  <p style={{ fontSize: "10px", color: MUTED, lineHeight: 1.5 }}>Set up your Revenue Profile in Settings to see how much your rating and unresponded reviews are costing you.</p>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: TEAL, flexShrink: 0, whiteSpace: "nowrap" }}>→ Settings</span>
              </div>
            );
          }
          const est = calculateRevenueAtRisk({
            avgCustomerValue:       revAvgValue,
            monthlyNewCustomers:    revMonthlyNew ?? 0,
            googleTrafficPercent:   revGooglePct  ?? 60,
            targetRating:           revTargetRating ?? 4.5,
            currentRating:          userRating ?? 4.0,
            repeatCustomersPerYear: revRepeat,
            grossMarginPercent:     revMargin,
            unrespondedCount,
            businessType,
          });
          const ratingGap = Math.max(0, (revTargetRating ?? 4.5) - (userRating ?? 4.0));
          if (est.monthlyLow === 0 && est.monthlyHigh === 0) return null;
          return (
            <div style={{ ...CARD, padding: "14px 16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <svg viewBox="0 0 20 20" fill={RED} style={{ width: 12, height: 12, flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.174L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8Zm11 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8Zm-6.828 2.828a.75.75 0 0 1 0 1.061L6.11 12.95a.75.75 0 0 1-1.06-1.06l1.06-1.062a.75.75 0 0 1 1.061 0Zm3.594-3.317a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 0 1-1.061 1.062l-1.06-1.061a.75.75 0 0 1 0-1.06ZM10 14a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 14Z" clipRule="evenodd"/>
                </svg>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: DARK, flex: 1 }}>
                  Revenue Intelligence
                </p>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: est.confidence === "high" ? "rgba(45,155,138,0.1)" : "rgba(196,135,74,0.1)", color: est.confidence === "high" ? TEAL : AMBER }}>
                  {est.confidence === "high" ? "Higher confidence" : "Directional"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <div style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                  <p style={{ fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>At Risk / Month</p>
                  <p style={{ fontSize: "0.95rem", fontWeight: 800, color: RED, lineHeight: 1 }}>
                    {formatCurrency(est.monthlyLow)}–{formatCurrency(est.monthlyHigh)}
                  </p>
                </div>
                <div style={{ background: "rgba(45,155,138,0.05)", border: "1px solid rgba(45,155,138,0.15)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                  <p style={{ fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>Recovery / Month</p>
                  <p style={{ fontSize: "0.95rem", fontWeight: 800, color: TEAL, lineHeight: 1 }}>
                    +{formatCurrency(est.recoveryMonthlyLow)}–{formatCurrency(est.recoveryMonthlyHigh)}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {ratingGap > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "10px", color: MUTED }}>★ Rating gap ({ratingGap.toFixed(1)}★ below target)</p>
                    <p style={{ fontSize: "10px", fontWeight: 600, color: RED }}>{formatCurrency(est.ratingGapMonthlyLow)}–{formatCurrency(est.ratingGapMonthlyHigh)}/mo</p>
                  </div>
                )}
                {est.unrespondedMonthlyHigh > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "10px", color: MUTED }}>{unrespondedCount} unresponded review{unrespondedCount !== 1 ? "s" : ""}</p>
                    <p style={{ fontSize: "10px", fontWeight: 600, color: AMBER }}>{formatCurrency(est.unrespondedMonthlyLow)}–{formatCurrency(est.unrespondedMonthlyHigh)}/mo</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Tab bar */}
        <div style={{ background: "#120804", borderRadius: "14px", padding: "5px", marginBottom: "16px", display: "flex", gap: "3px", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                background: activeTab === tab.key ? "#2D9B8A" : "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "10px",
                padding: "8px 4px",
                fontSize: "11px",
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? "white" : "rgba(255,255,255,0.4)",
                transition: "background 150ms, color 150ms",
                letterSpacing: activeTab === tab.key ? "0.01em" : "normal",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton height={200} />
            <Skeleton height={160} />
            <Skeleton height={120} />
          </div>
        ) : (
          <>
            {activeTab === "business" && (
              <MyBusinessTab
                key={`biz-${refreshKey}`}
                reviews={reviews}
                sentimentHistory={sentimentHistory}
                sentimentData={sentimentData}
                userTotalReviews={userTotalReviews}
              />
            )}
            {activeTab === "competitors" && (
              <CompetitorsTab
                key={`comp-${refreshKey}`}
                competitors={competitors}
                userRating={userRating}
                userReviewCount={userTotalReviews ?? reviews.length}
              />
            )}
            {activeTab === "market" && (
              <MarketTab
                key={`mkt-${refreshKey}`}
                competitors={competitors}
                userRating={userRating}
                sentimentData={sentimentData}
                businessType={businessType}
                businessName={businessName}
                businessAddress={businessAddress}
              />
            )}
            {activeTab === "opportunities" && (
              <OpportunitiesTab
                key={`opp-${refreshKey}`}
                reviews={reviews}
                competitors={competitors}
                userRating={userRating}
                userTotalReviews={userTotalReviews}
                sentimentData={sentimentData}
                businessName={businessName}
                businessType={businessType}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
