"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";
import MarkdownContent from "@/components/ui/MarkdownContent";

interface MonthlyReport {
  id: string;
  userId: string;
  businessName: string;
  month: number;
  year: number;
  totalReviews: number;
  avgRating: number;
  requestsSent: number;
  aiResponsesGenerated: number;
  reviewsFromVynta: number;
  competitorComparison: string;
  aiSummary: string;
  createdAt: string;
}

interface Competitor {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
}

const BLANK_COMPETITOR = { name: "", rating: "", reviewCount: "" };
const INPUT: React.CSSProperties = {
  background: "white",
  borderRadius: "10px",
  border: "none",
  boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
  padding: "10px 14px",
  fontSize: "13px",
  color: "#2C1A0E",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CARD: React.CSSProperties = {
  background: "#E8DCC8",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
};

function formatReportMonth(month: number, year: number) {
  return `${MONTHS[month - 1]} ${year}`;
}

function formatGeneratedDate(iso: string) {
  const d = new Date(iso);
  return `Generated ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px", color: "#A0856A", flexShrink: 0 }}>
      <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "40px", height: "40px", color: "#A0856A" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function SpinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
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
  const { user } = useUser();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Competitor manager
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorsOpen, setCompetitorsOpen] = useState(false);
  const [newComp, setNewComp] = useState(BLANK_COMPETITOR);

  // Sentiment analysis
  const [ourReviews, setOurReviews] = useState<Array<{ id?: string; text?: string }>>([]);
  const [sentimentData, setSentimentData] = useState<{
    positive: number; neutral: number; negative: number;
    keywords: string[]; summary: string;
  } | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentCacheKey, setSentimentCacheKey] = useState("");
  const [cacheStatus, setCacheStatus] = useState<"match" | "stale" | null>(null);

  useEffect(() => {
    // Load competitors from API
    fetch("/api/user/competitors")
      .then((r) => r.json())
      .then((data: Competitor[]) => {
        if (Array.isArray(data)) setCompetitors(data);
      })
      .catch(() => {});

    // Load reviews from API for sentiment analysis
    fetch("/api/user/reviews")
      .then((r) => r.json())
      .then((reviews: Array<{ id?: string; text?: string }>) => {
        if (!Array.isArray(reviews)) return;
        setOurReviews(reviews);
        const key = computeSentimentCacheKey(reviews);
        setSentimentCacheKey(key);
      })
      .catch(() => {});

    // Load sentiment cache from API
    fetch("/api/user/sentiment-cache")
      .then((r) => r.json())
      .then((data: { cacheKey?: string; data?: { positive: number; neutral: number; negative: number; keywords: string[]; summary: string } } | null) => {
        if (!data) return;
        // Compare cache key after reviews are loaded (will re-run when sentimentCacheKey is set)
        if (data.data) {
          setSentimentData(data.data);
        }
        // Store cache key for comparison
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

  // Check cache status once we have both the reviews key and cached data
  useEffect(() => {
    if (!sentimentCacheKey || !sentimentData) return;
    fetch("/api/user/sentiment-cache")
      .then((r) => r.json())
      .then((data: { cacheKey?: string } | null) => {
        if (!data?.cacheKey) return;
        if (data.cacheKey === sentimentCacheKey) {
          setCacheStatus("match");
        } else {
          setCacheStatus("stale");
        }
      })
      .catch(() => {});
  }, [sentimentCacheKey]);

  async function analyzeSentiment() {
    if (ourReviews.length < 3 || sentimentLoading) return;
    setSentimentLoading(true);
    const system = "You are a sentiment analysis engine. Return ONLY a raw JSON object — no markdown, no backticks, no explanation.";
    const reviewsText = ourReviews
      .map((r, i) => `${i + 1}. ${r.text ?? ""}`)
      .filter((line) => line.trim().length > 3)
      .join("\n");
    const msg = `Analyze the sentiment of these customer reviews and return ONLY a JSON object with no markdown or backticks:
{
  "positive": <integer percentage 0-100>,
  "neutral": <integer percentage 0-100>,
  "negative": <integer percentage 0-100>,
  "keywords": [<array of 6 most mentioned words or themes, each a short string, no filler words like 'the' or 'and'>],
  "summary": <one sentence describing the overall sentiment trend>
}
Reviews:
${reviewsText}`;
    try {
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
      });
      const data = (await res.json()) as { response?: string };
      const raw = (data.response ?? "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(raw) as { positive: number; neutral: number; negative: number; keywords: string[]; summary: string };
      setSentimentData(parsed);
      setCacheStatus("match");
      // Save to API
      await fetch("/api/user/sentiment-cache", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cacheKey: sentimentCacheKey, data: parsed }),
      }).catch(() => {});
    } catch {
      // silently fail
    } finally {
      setSentimentLoading(false);
    }
  }

  async function addCompetitor() {
    const name = newComp.name.trim();
    const rating = parseFloat(newComp.rating);
    const reviewCount = parseInt(newComp.reviewCount, 10);
    if (!name || isNaN(rating) || rating < 1 || rating > 5 || isNaN(reviewCount) || reviewCount < 0) return;
    const payload = { name, rating, reviewCount };
    // Optimistic add with temp id
    const tempId = `temp-${Date.now()}`;
    setCompetitors((prev) => [...prev, { ...payload, id: tempId }]);
    setNewComp(BLANK_COMPETITOR);
    try {
      const res = await fetch("/api/user/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json() as Competitor;
        setCompetitors((prev) => prev.map((c) => c.id === tempId ? created : c));
      }
    } catch {}
  }

  async function deleteCompetitor(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/user/competitors/${id}`, { method: "DELETE" });
    } catch {}
  }

  useEffect(() => {
    if (!user?.id) return;
    fetchReports(user.id);
  }, [user?.id]);

  async function fetchReports(userId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/list?userId=${userId}`);
      if (res.ok) {
        const data = (await res.json()) as MonthlyReport[];
        setReports(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function openReport(report: MonthlyReport) {
    setSelectedReport(report);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setTimeout(() => setSelectedReport(null), 350);
  }

  async function generateReport() {
    if (!user?.id || generating) return;
    setGenerating(true);

    let totalReviews = 0;
    let avgRating = 0;
    let requestsSent = 0;
    let aiResponsesGenerated = 0;
    let reviewsFromVynta = 0;
    let businessName = "My Business";
    let reportCompetitors: Competitor[] = [];

    try {
      // Fetch all needed data from APIs
      const [reviewsRes, campaignsRes, historyRes, settingsRes] = await Promise.all([
        fetch("/api/user/reviews").then((r) => r.json()),
        fetch("/api/user/campaigns").then((r) => r.json()),
        fetch("/api/user/response-history").then((r) => r.json()),
        fetch("/api/user/settings").then((r) => r.json()),
      ]);

      const reviews = reviewsRes as Array<{ rating: number; responded: boolean }>;
      if (Array.isArray(reviews)) {
        totalReviews = reviews.length;
        avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
        reviewsFromVynta = reviews.length;
      }

      const campaigns = campaignsRes as Array<{ contacts: unknown[] }>;
      if (Array.isArray(campaigns)) {
        requestsSent = campaigns.reduce((sum, c) => sum + (Array.isArray(c.contacts) ? c.contacts.length : 0), 0);
      }

      const history = historyRes as unknown[];
      if (Array.isArray(history)) {
        aiResponsesGenerated = history.length;
      }

      const settings = settingsRes as { businessName?: string };
      businessName = settings.businessName ?? "My Business";

      reportCompetitors = competitors;
    } catch {}

    const now = new Date();

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          businessName,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          totalReviews,
          avgRating,
          requestsSent,
          aiResponsesGenerated,
          reviewsFromVynta,
          competitors: reportCompetitors,
        }),
      });

      if (res.ok) {
        await fetchReports(user.id);
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }

  const now = new Date();
  const currentMonthExists = reports.some(
    (r) => r.month === now.getMonth() + 1 && r.year === now.getFullYear()
  );

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Detail modal ── */}
      {selectedReport && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(44,26,14,0.5)",
            transition: "opacity 350ms",
            opacity: modalVisible ? 1 : 0,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#FAF5E8",
              borderRadius: "24px 24px 0 0",
              maxHeight: "92vh",
              overflowY: "auto",
              transform: modalVisible ? "translateY(0)" : "translateY(100%)",
              transition: "transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle + close */}
            <div style={{ position: "sticky", top: 0, background: "#FAF5E8", padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
              <div style={{ width: "40px", height: "4px", borderRadius: "99px", background: "rgba(44,26,14,0.15)", margin: "0 auto" }} />
              <button
                type="button"
                onClick={closeModal}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#A0856A", padding: "4px", lineHeight: 0 }}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </div>

            <div style={{ padding: "0 20px 48px" }}>
              {/* Heading */}
              <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1, marginBottom: "6px" }}>
                {formatReportMonth(selectedReport.month, selectedReport.year)}
              </h2>
              <p style={{ fontSize: "12px", color: "#A0856A", marginBottom: "24px" }}>
                Generated automatically by Vynta
              </p>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                {[
                  { label: "Total Reviews", value: String(selectedReport.totalReviews) },
                  { label: "Avg Rating", value: `${selectedReport.avgRating} ★` },
                  { label: "Requests Sent", value: String(selectedReport.requestsSent) },
                  { label: "AI Responses", value: String(selectedReport.aiResponsesGenerated) },
                  { label: "From Vynta", value: String(selectedReport.reviewsFromVynta) },
                  { label: "Month", value: formatReportMonth(selectedReport.month, selectedReport.year) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ ...CARD, padding: "14px" }}>
                    <p style={{
                      fontSize: label === "Month" ? "13px" : "1.8rem",
                      fontWeight: 700,
                      color: "#4F46E5",
                      lineHeight: 1.1,
                      marginBottom: "6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {value}
                    </p>
                    <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              <div style={{ ...CARD, padding: "16px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "15px" }}>✨</span>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4F46E5" }}>
                    AI Summary
                  </p>
                </div>
                <div style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.7 }}>
                  <MarkdownContent>{selectedReport.aiSummary}</MarkdownContent>
                </div>
              </div>

              {/* Competitor Comparison */}
              {selectedReport.competitorComparison && (
                <div style={{ ...CARD, padding: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "15px" }}>📊</span>
                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C4874A" }}>
                      Competitor Comparison
                    </p>
                  </div>
                  <div style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.7 }}>
                    <MarkdownContent>{selectedReport.competitorComparison}</MarkdownContent>
                  </div>
                </div>
              )}

              {/* Footer */}
              <p style={{ fontSize: "11px", color: "#A0856A", textAlign: "center" }}>
                Report generated on {new Date(selectedReport.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <UpgradeTooltip locked={!canAccess(plan, "monthlyReports")} requiredPlan="Agency">
      <div style={{ padding: "28px 24px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1 }}>
                Monthly Reports
              </h1>
              <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "5px" }}>
                Auto-generated on the 1st of each month
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

        {/* ── Competitor Manager ── */}
        <div style={{ marginBottom: "16px" }}>
          {/* Toggle row */}
          <button
            type="button"
            onClick={() => setCompetitorsOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: "#E8DCC8",
              borderRadius: competitorsOpen ? "16px 16px 0 0" : "16px",
              border: "none",
              borderLeft: "3px solid #2D9B8A",
              padding: "13px 16px",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
              transition: "border-radius 200ms",
            }}
          >
            <span style={{ flex: 1, textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#2C1A0E" }}>
              Manage Competitors
            </span>
            <span style={{ fontSize: "11px", color: "#A0856A", marginRight: "10px" }}>
              {competitors.length > 0 ? `${competitors.length} tracked` : "None added"}
            </span>
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{
                width: "14px", height: "14px", color: "#A0856A", flexShrink: 0,
                transform: competitorsOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 200ms",
              }}
            >
              <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Expanded panel */}
          {competitorsOpen && (
            <div style={{
              background: "#E8DCC8",
              borderRadius: "0 0 16px 16px",
              borderLeft: "3px solid #2D9B8A",
              padding: "0 16px 16px",
              boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
            }}>
              <div style={{ height: "1px", background: "rgba(44,26,14,0.08)", marginBottom: "14px" }} />

              {/* Competitor list */}
              {competitors.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#A0856A", textAlign: "center", padding: "8px 0 14px" }}>
                  No competitors added yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                  {competitors.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        background: "rgba(44,26,14,0.05)", borderRadius: "10px", padding: "10px 12px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.name}
                        </p>
                        <p style={{ fontSize: "11px", color: "#7B5E45", marginTop: "2px" }}>
                          ⭐ {c.rating.toFixed(1)} &nbsp;·&nbsp; 📝 {c.reviewCount.toLocaleString()} reviews
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCompetitor(c.id)}
                        aria-label="Delete competitor"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#D32323", padding: "4px", lineHeight: 0, flexShrink: 0 }}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px" }}>
                          <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15H5.405a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add form */}
              {competitors.length >= 5 ? (
                <p style={{ fontSize: "12px", color: "#A0856A", textAlign: "center", padding: "4px 0" }}>
                  Maximum 5 competitors reached.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    value={newComp.name}
                    onChange={(e) => setNewComp((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Business name (e.g. Joe's Plumbing)"
                    style={INPUT}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input
                      type="number"
                      value={newComp.rating}
                      onChange={(e) => setNewComp((p) => ({ ...p, rating: e.target.value }))}
                      placeholder="Rating (e.g. 4.2)"
                      min={1} max={5} step={0.1}
                      style={INPUT}
                    />
                    <input
                      type="number"
                      value={newComp.reviewCount}
                      onChange={(e) => setNewComp((p) => ({ ...p, reviewCount: e.target.value }))}
                      placeholder="Reviews (e.g. 142)"
                      min={0}
                      style={INPUT}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCompetitor}
                    disabled={
                      !newComp.name.trim() ||
                      !newComp.rating ||
                      !newComp.reviewCount ||
                      parseFloat(newComp.rating) < 1 ||
                      parseFloat(newComp.rating) > 5
                    }
                    style={{
                      background: "#2D9B8A",
                      color: "white",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      opacity: (!newComp.name.trim() || !newComp.rating || !newComp.reviewCount) ? 0.5 : 1,
                      transition: "opacity 150ms",
                    }}
                  >
                    + Add Competitor
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Report list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <SpinIcon size={24} />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ ...CARD, padding: "52px 24px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <FileTextIcon />
            </div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#2C1A0E", marginBottom: "8px" }}>
              No reports yet
            </p>
            <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.6 }}>
              Your first report will be generated automatically<br />on the 1st of next month.
            </p>
          </div>
        ) : (
          <div style={{ ...CARD, overflow: "hidden" }}>
            {reports.map((report, i) => (
              <button
                key={report.id}
                type="button"
                onClick={() => openReport(report)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "14px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: i < reports.length - 1 ? "1px solid rgba(44,26,14,0.07)" : "none",
                }}
              >
                {/* Month label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E", marginBottom: "2px" }}>
                    {formatReportMonth(report.month, report.year)}
                  </p>
                  <p style={{ fontSize: "11px", color: "#A0856A" }}>
                    {formatGeneratedDate(report.createdAt)}
                  </p>
                </div>

                {/* Stats */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#4F46E5" }}>
                    {report.avgRating.toFixed(1)} ★
                  </p>
                  <p style={{ fontSize: "11px", color: "#A0856A" }}>
                    {report.totalReviews} review{report.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>

                <ChevronRight />
              </button>
            ))}
          </div>
        )}

        {/* Manual generate button */}
        {!currentMonthExists && (
          <button
            type="button"
            onClick={generateReport}
            disabled={generating || !user?.id}
            style={{
              width: "100%",
              marginTop: "16px",
              background: generating ? "#A0856A" : "#2D9B8A",
              color: "white",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: generating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 150ms",
            }}
          >
            {generating ? (
              <>
                <SpinIcon size={16} />
                Generating…
              </>
            ) : "Generate This Month's Report"}
          </button>
        )}

        {/* ── Sentiment Analysis ── */}
        <UpgradeTooltip locked={!canAccess(plan, "sentimentAnalysis")} requiredPlan="Agency">
        <div style={{ ...CARD, padding: "18px", marginTop: "16px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
            <div>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", fontWeight: 600 }}>
                Sentiment Analysis
              </p>
              <p style={{ fontSize: "10px", color: "#4F46E5", marginTop: "2px" }}>
                Powered by AI · based on your logged reviews
              </p>
            </div>
            {sentimentData && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {cacheStatus === "stale" && (
                  <span style={{ fontSize: "10px", color: "#C4874A", fontWeight: 600 }}>New reviews detected</span>
                )}
                {cacheStatus === "match" && (
                  <span style={{ fontSize: "10px", color: "#4F46E5", fontWeight: 600 }}>Up to date</span>
                )}
                <button
                  type="button"
                  onClick={analyzeSentiment}
                  disabled={sentimentLoading || cacheStatus === "match"}
                  aria-label="Refresh sentiment"
                  style={{
                    background: "none", border: "none",
                    cursor: (sentimentLoading || cacheStatus === "match") ? "default" : "pointer",
                    color: "#A0856A", padding: "2px", lineHeight: 0,
                    opacity: (sentimentLoading || cacheStatus === "match") ? 0.4 : 1,
                  }}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px" }}>
                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.75.75 0 0 1 1.36-.636A6.5 6.5 0 1 1 8 1.5v-.75a.25.25 0 0 1 .427-.177l2.25 2.25a.25.25 0 0 1 0 .354l-2.25 2.25A.25.25 0 0 1 8 5.25V3Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {ourReviews.length < 3 ? (
            <p style={{ fontSize: "12px", color: "#4F46E5", marginTop: "10px" }}>
              Log at least 3 reviews to unlock sentiment analysis.
            </p>
          ) : !sentimentData ? (
            <button
              type="button"
              onClick={analyzeSentiment}
              disabled={sentimentLoading}
              style={{
                marginTop: "10px",
                width: "100%",
                background: sentimentLoading ? "#A0856A" : "#2C1A0E",
                color: "white",
                borderRadius: "10px",
                padding: "10px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: sentimentLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {sentimentLoading ? (
                <>
                  <SpinIcon size={13} />
                  Analysing…
                </>
              ) : "Analyse Sentiment"}
            </button>
          ) : (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Positive", value: sentimentData.positive, color: "#2D9B8A" },
                { label: "Neutral",  value: sentimentData.neutral,  color: "#C4874A" },
                { label: "Negative", value: sentimentData.negative, color: "#C0392B" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#7B5E45", width: "54px", flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: "8px", borderRadius: "99px", background: "rgba(44,26,14,0.08)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "99px",
                        background: color,
                        width: `${value}%`,
                        transition: "width 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#2C1A0E", width: "32px", textAlign: "right", flexShrink: 0 }}>
                    {value}%
                  </span>
                </div>
              ))}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {sentimentData.keywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      background: "#E8DCC8",
                      color: "#2C1A0E",
                      borderRadius: "20px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: "12px", color: "#7B5E45", lineHeight: 1.6, margin: 0 }}>
                {sentimentData.summary}
              </p>
            </div>
          )}
        </div>
        </UpgradeTooltip>

      </div>
      </UpgradeTooltip>
    </div>
  );
}
