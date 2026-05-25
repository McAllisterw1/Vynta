"use client";

import { useState, useEffect } from "react";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { useResponseHistory } from "@/lib/useResponseHistory";
import { useMonthlyUsage } from "@/lib/useMonthlyUsage";

const CARD: React.CSSProperties = {
  background: "#E8DCC8",
  borderRadius: "20px",
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

interface WeeklyStats {
  reviews: number;
  requests: number;
  responses: number;
  unresponded: number;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  const { history } = useResponseHistory();
  const { count: monthlyUsage } = useMonthlyUsage(plan);
  const [requestsSent, setRequestsSent] = useState(0);

  // Score predictor
  const [ourTotalReviews, setOurTotalReviews] = useState(0);
  const [ourAvgRating, setOurAvgRating] = useState<number | null>(null);
  const [targetRating, setTargetRating] = useState(4.5);

  // Weekly report
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ reviews: 0, requests: 0, responses: 0, unresponded: 0 });
  const [weeklyTip, setWeeklyTip] = useState("");
  const [weeklyTipLoading, setWeeklyTipLoading] = useState(true);

  useEffect(() => {
    // Load reviews for score predictor and weekly stats
    fetch("/api/user/reviews")
      .then((r) => r.json())
      .then((reviews: Array<{ date: string; responded: boolean; rating: number }>) => {
        if (!Array.isArray(reviews)) return;
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : null;
        setOurTotalReviews(total);
        setOurAvgRating(avg !== null ? parseFloat(avg.toFixed(1)) : null);

        setWeeklyStats((prev) => ({
          ...prev,
          reviews: reviews.filter((r) => isThisWeek(r.date)).length,
          unresponded: reviews.filter((r) => !r.responded).length,
        }));
      })
      .catch(() => {});

    // Load campaigns for requests sent and weekly requests
    fetch("/api/user/campaigns")
      .then((r) => r.json())
      .then((campaigns: Array<{ createdAt: string; contacts: unknown[] }>) => {
        if (!Array.isArray(campaigns)) return;
        const total = campaigns.reduce((sum, c) => sum + (Array.isArray(c.contacts) ? c.contacts.length : 0), 0);
        setRequestsSent(total);
        const weeklyRequests = campaigns
          .filter((c) => isThisWeek(c.createdAt))
          .reduce((sum, c) => sum + (Array.isArray(c.contacts) ? c.contacts.length : 0), 0);
        setWeeklyStats((prev) => ({ ...prev, requests: weeklyRequests }));
      })
      .catch(() => {});
  }, []);

  // Weekly responses stat from history (already fetched by hook)
  useEffect(() => {
    const weeklyResponses = history.filter((e) => isThisWeek(e.createdAt)).length;
    setWeeklyStats((prev) => ({ ...prev, responses: weeklyResponses }));
  }, [history]);

  // Fetch weekly tip from Claude
  useEffect(() => {
    let weeklyCompetitorContext = "";

    fetch("/api/user/competitors")
      .then((r) => r.json())
      .then((comps: Array<{ name: string; rating: number; reviewCount: number }>) => {
        if (Array.isArray(comps) && comps.length > 0) {
          weeklyCompetitorContext = ` Competitor context: ${comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ")}.`;
        }
      })
      .catch(() => {})
      .finally(() => {
        const system = "You are a reputation growth coach. Based on a business's weekly activity data, write exactly one short, specific, actionable next-step sentence (max 25 words). Be direct, coach-like, no fluff. Return plain text only — no JSON, no bullet points.";
        const msg = `This week: ${weeklyStats.reviews} reviews logged, ${weeklyStats.requests} review requests sent, ${weeklyStats.responses} AI responses generated, ${weeklyStats.unresponded} reviews still awaiting a response.${weeklyCompetitorContext} What is the single most impactful thing they should do next?`;

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
      });
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
    { label: "Total Responses", value: String(history.length),      badge: "All time",    desc: "AI replies generated to customer reviews" },
    { label: "Average Rating",  value: avgRating ?? "—",            badge: "out of 5",    desc: "Mean star rating across all logged responses" },
    { label: "Requests Sent",   value: String(requestsSent),        badge: "none yet",    desc: "Review requests sent to customers via campaign" },
    { label: "This Month",      value: String(monthlyUsage),        badge: "this period", desc: "AI responses generated in the current month" },
    { label: "Top Tone",        value: topTone ? capitalize(topTone) : "—", badge: "Most used", desc: "Your most-used AI reply personality" },
  ];

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
          {stats.slice(0, 3).map(({ label, value, badge, desc }) => (
            <div key={label} style={{ ...CARD, padding: "18px" }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>{value}</p>
              <span style={BADGE}>{badge}</span>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "8px" }}>{label}</p>
              <p style={{ fontSize: "10px", color: "#A0856A", marginTop: "4px", lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* 2 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {stats.slice(3).map(({ label, value, badge, desc }) => (
            <div key={label} style={{ ...CARD, padding: "18px" }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>{value}</p>
              <span style={BADGE}>{badge}</span>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "8px" }}>{label}</p>
              <p style={{ fontSize: "10px", color: "#A0856A", marginTop: "4px", lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ ...CARD, padding: "18px 18px 16px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
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
            <div style={{ padding: "24px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "13px", color: "#A0856A", textAlign: "center", lineHeight: 1.6 }}>
                No responses yet.<br />Start by responding to a review on the Home tab.
              </p>
            </div>
          ) : (
            <div>
              {/* Bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "100px" }}>
                {months.map((m) => {
                  const barH = m.count === 0 ? 3 : Math.max((m.count / maxCount) * 88, 8);
                  return (
                    <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "4px", height: "100%" }}>
                      {m.count > 0 && (
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#5C3A1E" }}>{m.count}</span>
                      )}
                      <div style={{
                        width: "100%",
                        height: `${barH}px`,
                        borderRadius: "5px 5px 3px 3px",
                        background: m.count === 0
                          ? "#E0D4C0"
                          : m.isCurrent
                          ? "linear-gradient(180deg, #7B3F1A 0%, #C4874A 100%)"
                          : "linear-gradient(180deg, #C4874A 0%, #E0A06A 100%)",
                      }} />
                    </div>
                  );
                })}
              </div>
              {/* Month labels */}
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {months.map((m) => (
                  <div key={m.key} style={{ flex: 1, textAlign: "center" }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: m.isCurrent ? 700 : 400,
                      color: m.isCurrent ? "#2C1A0E" : "#A0856A",
                    }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Google Review Score Predictor ── */}
        <UpgradeTooltip locked={!canAccess(plan, "scorePredictor")} requiredPlan="Pro">
        <div style={{ ...CARD, padding: "18px" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", fontWeight: 600, marginBottom: "4px" }}>
            Score Predictor
          </p>
          <p style={{ fontSize: "10px", color: "#A0856A", lineHeight: 1.5, marginBottom: "14px" }}>
            Set your goal rating and we calculate exactly how many new 5-star reviews you need to reach it. 4.5 is the default — the threshold most customers filter by on Google.
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
