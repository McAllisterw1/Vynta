"use client";

import { useState, useEffect } from "react";

const HISTORY_KEY = "vynta_response_history";
const REQUESTS_KEY = "vynta_requests_sent";

const CARD: React.CSSProperties = {
  background: "#F0E9D8",
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

interface Entry {
  id: string;
  createdAt: string;
  rating: number;
  tone?: string;
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

export default function AnalyticsScreen() {
  const [history, setHistory] = useState<Entry[]>([]);
  const [requestsSent, setRequestsSent] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);

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
    { label: "Requests Sent",   value: String(requestsSent),        badge: "All time" },
    { label: "This Month",      value: String(monthlyUsage),        badge: "Current month" },
    { label: "Top Tone",        value: topTone ? capitalize(topTone) : "—", badge: "Most used" },
  ];

  // Bar chart geometry
  const SLOT_W = 60;
  const BAR_W = 20;
  const BAR_X_OFFSET = (SLOT_W - BAR_W) / 2; // 20
  const CHART_BASE = 82;
  const CHART_TOP = 10;
  const CHART_H = CHART_BASE - CHART_TOP; // 72

  return (
    <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", padding: "24px 24px 0", gap: "12px" }}>

      {/* Title */}
      <div style={{ flexShrink: 0 }}>
        <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1 }}>Analytics</h1>
        <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "4px" }}>Your reputation at a glance.</p>
      </div>

      {/* 3 stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", flexShrink: 0 }}>
        {stats.slice(0, 3).map(({ label, value, badge }) => (
          <div key={label} style={{ ...CARD, padding: "18px" }}>
            <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>{value}</p>
            <span style={BADGE}>{badge}</span>
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "8px" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* 2 stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flexShrink: 0 }}>
        {stats.slice(3).map(({ label, value, badge }) => (
          <div key={label} style={{ ...CARD, padding: "18px" }}>
            <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>{value}</p>
            <span style={BADGE}>{badge}</span>
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginTop: "8px" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ ...CARD, flex: 1, minHeight: 0, padding: "18px 18px 16px", marginBottom: "120px", display: "flex", flexDirection: "column" }}>
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
            <p style={{ fontSize: "13px", color: "#A0856A" }}>No data yet.</p>
          </div>
        ) : (
          <svg viewBox="0 0 360 110" style={{ width: "100%", flex: 1 }} preserveAspectRatio="none">
            {/* Single grid line at top */}
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
                  {/* Bar */}
                  {isZero ? (
                    <rect x={x} y={topY} width={BAR_W} height={barH} rx={2} fill="#E0D4C0" />
                  ) : (
                    <path d={barPath(x, topY, BAR_W, barH, 6)} fill={fill} />
                  )}

                  {/* Count label */}
                  {!isZero && (
                    <text x={cx} y={topY - 4} textAnchor="middle" fontSize={8} fill="#5C3A1E" fontWeight="700">
                      {m.count}
                    </text>
                  )}

                  {/* Month label */}
                  <text
                    x={cx}
                    y={100}
                    textAnchor="middle"
                    fontSize={9}
                    fill={m.isCurrent ? "#2C1A0E" : "#A0856A"}
                    fontWeight={m.isCurrent ? "700" : "400"}
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
