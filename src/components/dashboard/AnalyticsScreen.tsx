"use client";

import { useState, useEffect } from "react";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";
import MarkdownContent from "@/components/ui/MarkdownContent";

const HISTORY_KEY = "vynta_response_history";
const REQUESTS_KEY = "vynta_requests_sent";

const CARD: React.CSSProperties = {
  background: "#E8DCC8",
  borderRadius: "16px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const BADGE: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(196,135,74,0.12)",
  color: "#A0856A",
  borderRadius: "20px",
  padding: "2px 8px",
  fontSize: "10px",
  fontWeight: 500,
  marginTop: "6px",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid rgba(44,26,14,0.07)",
};

interface Entry {
  id: string;
  createdAt: string;
  rating: number;
  tone?: string;
}

interface WeeklyStats {
  reviews: number;
  requests: number;
  responses: number;
  unresponded: number;
}

function getMonthKey(d: Date) {
  return `vynta_usage_${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function barPath(x: number, topY: number, w: number, h: number, r: number): string {
  const r2 = Math.min(r, h);
  return `M ${x},${topY + r2} Q ${x},${topY} ${x + r2},${topY} H ${x + w - r2} Q ${x + w},${topY} ${x + w},${topY + r2} V ${topY + h} H ${x} Z`;
}

function isThisWeek(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return d >= cutoff;
  } catch {
    return false;
  }
}

export default function AnalyticsScreen({ plan }: { plan?: string | null } = {}) {
  const [history, setHistory] = useState<Entry[]>([]);
  const [requestsSent, setRequestsSent] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);

  // Score predictor
  const [ourTotalReviews, setOurTotalReviews] = useState(0);
  const [ourAvgRating, setOurAvgRating] = useState<number | null>(null);
  const [targetRating, setTargetRating] = useState(4.5);

  // Weekly report
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ reviews: 0, requests: 0, responses: 0, unresponded: 0 });
  const [weeklyTip, setWeeklyTip] = useState("");
  const [weeklyTipLoading, setWeeklyTipLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
      const req = localStorage.getItem(REQUESTS_KEY);
      if (req) setRequestsSent(parseInt(req, 10) || 0);
      const usage = localStorage.getItem(getMonthKey(new Date()));
      if (usage) setMonthlyUsage(parseInt(usage, 10) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    // Score predictor data
    try {
      const raw = localStorage.getItem("vynta_stats");
      if (raw) {
        const s = JSON.parse(raw) as { totalReviews?: number; avgRating?: number | null };
        setOurTotalReviews(s.totalReviews ?? 0);
        setOurAvgRating(s.avgRating ?? null);
      }
    } catch {}

    // Weekly stats
    const weekly: WeeklyStats = { reviews: 0, requests: 0, responses: 0, unresponded: 0 };

    try {
      const raw = localStorage.getItem("vynta_our_reviews");
      if (raw) {
        const reviews = JSON.parse(raw) as Array<{ date: string; responded: boolean }>;
        weekly.reviews = reviews.filter((r) => isThisWeek(r.date)).length;
        weekly.unresponded = reviews.filter((r) => !r.responded).length;
      }
    } catch {}

    try {
      const raw = localStorage.getItem("vynta_campaigns");
      if (raw) {
        const campaigns = JSON.parse(raw) as Array<{ createdAt: string; contacts: unknown[] }>;
        weekly.requests = campaigns
          .filter((c) => isThisWeek(c.createdAt))
          .reduce((sum, c) => sum + c.contacts.length, 0);
      }
    } catch {}

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const hist = JSON.parse(raw) as Array<{ createdAt: string }>;
        weekly.responses = hist.filter((e) => isThisWeek(e.createdAt)).length;
      }
    } catch {}

    setWeeklyStats(weekly);

    let weeklyCompetitorContext = "";
    try {
      const comps = JSON.parse(localStorage.getItem("vynta_competitors") || "[]") as Array<{ name: string; rating: number; reviewCount: number }>;
      if (comps.length > 0) {
        weeklyCompetitorContext = ` Competitor context: ${comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ")}.`;
      }
    } catch {}

    // Claude tip for the week
    const system = "You are a reputation growth coach. Based on a business's weekly activity data, write exactly one short, specific, actionable next-step sentence (max 25 words). Be direct, coach-like, no fluff. Return plain text only — no JSON, no bullet points.";
    const msg = `This week: ${weekly.reviews} reviews logged, ${weekly.requests} review requests sent, ${weekly.responses} AI responses generated, ${weekly.unresponded} reviews still awaiting a response.${weeklyCompetitorContext} What is the single most impactful thing they should do next?`;

    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
    })
      .then((res) => res.json())
      .then((data: { response?: string }) => {
        setWeeklyTip(data.response?.trim() ?? "");
      })
      .catch(() => {})
      .finally(() => setWeeklyTipLoading(false));
  }, []);

  // Score predictor helpers
  const needed =
    ourAvgRating !== null && ourTotalReviews > 0 && targetRating < 5
      ? Math.ceil((ourTotalReviews * (targetRating - ourAvgRating)) / (5 - targetRating))
      : null;

  function adjustTarget(delta: number) {
    setTargetRating((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.min(5.0, Math.max(1.0, next));
    });
  }

  // AI response history stats
  const avgRating =
    history.length > 0
      ? (history.reduce((s, e) => s + e.rating, 0) / history.length).toFixed(1)
      : null;

  const toneCounts = history.reduce<Record<string, number>>((acc, e) => {
    if (e.tone) acc[e.tone] = (acc[e.tone] ?? 0) + 1;
    return acc;
  }, {});
  const topTone = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      count: 0,
      isCurrent: i === 5,
    };
  });
  history.forEach((e) => {
    const key = e.createdAt.slice(0, 7);
    const m = months.find((mo) => mo.key === key);
    if (m) m.count++;
  });
  const maxCount = Math.max(...months.map((m) => m.count), 1);
  const peakMonth = months.reduce(
    (best, m) => (m.count > best.count ? m : best),
    months[0]
  );

  const stats = [
    { label: "Total Responses", value: String(history.length),      badge: "All time" },
    { label: "Average Rating",  value: avgRating ?? "—",            badge: "out of 5" },
    { label: "Requests Sent",   value: String(requestsSent),        badge: "none yet" },
    { label: "This Month",      value: String(monthlyUsage),        badge: "this period" },
    { label: "Top Tone",        value: topTone ? capitalize(topTone) : "—", badge: "Most used" },
  ];

  const SLOT_W = 60;
  const BAR_W = 20;
  const BAR_X_OFFSET = (SLOT_W - BAR_W) / 2;
  const CHART_BASE = 82;
  const CHART_TOP = 10;
  const CHART_H = CHART_BASE - CHART_TOP;

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "28px 24px 120px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Title */}
        <div>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1 }}>Analytics</h1>
          <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "4px" }}>Your reputation at a glance.</p>
        </div>

        {/* 3 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {stats.slice(0, 3).map(({ label, value, badge }) => (
            <div key={label} style={{ ...CARD, padding: "18px" }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>{value}</p>
              <span style={BADGE}>{badge}</span>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "8px" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* 2 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {stats.slice(3).map(({ label, value, badge }) => (
            <div key={label} style={{ ...CARD, padding: "18px" }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>{value}</p>
              <span style={BADGE}>{badge}</span>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "8px" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ ...CARD, height: "220px", padding: "18px 18px 16px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexShrink: 0 }}>
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", fontWeight: 600 }}>
              Responses per Month
            </p>
            {peakMonth.count > 0 && (
              <p style={{ fontSize: "10px", color: "#A0856A" }}>
                Peak: <span style={{ fontWeight: 700, color: "#7B3F1A" }}>{peakMonth.label}</span>
              </p>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "13px", color: "#A0856A", textAlign: "center", lineHeight: 1.6 }}>
                No responses generated yet.<br />Start by responding to a review on the Home tab.
              </p>
            </div>
          ) : (
            <svg viewBox="0 0 360 110" style={{ width: "100%", flex: 1 }} preserveAspectRatio="none">
              <line x1={0} y1={CHART_TOP} x2={360} y2={CHART_TOP} stroke="#E8DDD0" strokeWidth={1} />
              {months.map((m, i) => {
                const x = i * SLOT_W + BAR_X_OFFSET;
                const cx = i * SLOT_W + SLOT_W / 2;
                const isZero = m.count === 0;
                const barH = isZero ? 4 : Math.max((m.count / maxCount) * CHART_H, 6);
                const topY = CHART_BASE - barH;
                const fill = m.isCurrent ? "#7B3F1A" : "#C4874A";
                return (
                  <g key={m.key}>
                    {isZero ? (
                      <rect x={x} y={topY} width={BAR_W} height={barH} rx={2} fill="#E0D4C0" />
                    ) : (
                      <path d={barPath(x, topY, BAR_W, barH, 6)} fill={fill} />
                    )}
                    {!isZero && (
                      <text x={cx} y={topY - 4} textAnchor="middle" fontSize={8} fill="#5C3A1E" fontWeight="700">
                        {m.count}
                      </text>
                    )}
                    <text x={cx} y={100} textAnchor="middle" fontSize={9} fill={m.isCurrent ? "#2C1A0E" : "#A0856A"} fontWeight={m.isCurrent ? "700" : "400"}>
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* ── Google Review Score Predictor ── */}
        <UpgradeTooltip locked={!canAccess(plan, "scorePredictor")} requiredPlan="Pro">
        <div style={{ ...CARD, padding: "18px" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", fontWeight: 600, marginBottom: "14px" }}>
            Score Predictor
          </p>

          {/* Target rating control */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", color: "#2C1A0E", fontWeight: 500 }}>Target rating</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => adjustTarget(-0.1)}
                disabled={targetRating <= 1.0}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(44,26,14,0.08)", border: "none",
                  cursor: targetRating <= 1.0 ? "not-allowed" : "pointer",
                  fontSize: "16px", lineHeight: 1, color: "#2C1A0E",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: targetRating <= 1.0 ? 0.4 : 1,
                }}
              >
                −
              </button>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#2C1A0E", minWidth: "52px", textAlign: "center" }}>
                {targetRating.toFixed(1)} ★
              </span>
              <button
                type="button"
                onClick={() => adjustTarget(0.1)}
                disabled={targetRating >= 5.0}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(44,26,14,0.08)", border: "none",
                  cursor: targetRating >= 5.0 ? "not-allowed" : "pointer",
                  fontSize: "16px", lineHeight: 1, color: "#2C1A0E",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: targetRating >= 5.0 ? 0.4 : 1,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Result */}
          {ourAvgRating !== null && ourTotalReviews > 0 ? (
            needed !== null && needed <= 0 ? (
              <p style={{
                fontSize: "13px", color: "#2D9B8A", fontWeight: 600,
                background: "rgba(45,155,138,0.1)", borderRadius: "10px", padding: "10px 14px",
              }}>
                🎉 You&apos;ve hit your target! Keep the momentum going.
              </p>
            ) : needed !== null ? (
              <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.6 }}>
                You need{" "}
                <strong style={{ fontSize: "18px", color: "#C4874A" }}>{needed}</strong>
                {" "}more 5-star review{needed !== 1 ? "s" : ""} to reach a{" "}
                <strong>{targetRating.toFixed(1)}</strong> star rating.
              </p>
            ) : null
          ) : (
            <p style={{ fontSize: "12px", color: "#A0856A" }}>
              Log reviews in the Reviews tab to unlock this tool.
            </p>
          )}
        </div>
        </UpgradeTooltip>

        {/* ── Weekly Reputation Report ── */}
        <UpgradeTooltip locked={!canAccess(plan, "weeklyReport")} requiredPlan="Agency">
        <div style={{ ...CARD, padding: "18px" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", fontWeight: 600, marginBottom: "14px" }}>
            This Week
          </p>

          {/* Stat rows */}
          {[
            { label: "Reviews logged", value: weeklyStats.reviews },
            { label: "Requests sent", value: weeklyStats.requests },
            { label: "Responses generated", value: weeklyStats.responses },
            { label: "Awaiting your reply", value: weeklyStats.unresponded },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0",
                ...(i < arr.length - 1 ? DIVIDER : {}),
              }}
            >
              <span style={{ fontSize: "13px", color: "#7B5E45" }}>{row.label}</span>
              <span style={{
                fontSize: "16px", fontWeight: 700,
                color: row.label === "Awaiting your reply" && row.value > 0 ? "#C4874A" : "#2C1A0E",
              }}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Claude tip */}
          {weeklyTipLoading ? (
            <div style={{ display: "flex", gap: "4px", padding: "12px 0 2px", justifyContent: "flex-start" }}>
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="animate-bounce"
                  style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#A0856A", display: "inline-block", animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          ) : weeklyTip ? (
            <div style={{
              fontSize: "12px", color: "#2C1A0E", marginTop: "12px",
              background: "rgba(45,155,138,0.08)", padding: "10px 12px",
              borderRadius: "10px",
            }}>
              <span style={{ fontWeight: 600 }}>💡 Suggested next step: </span>
              <MarkdownContent>{weeklyTip}</MarkdownContent>
            </div>
          ) : null}
        </div>
        </UpgradeTooltip>

      </div>
    </div>
  );
}
