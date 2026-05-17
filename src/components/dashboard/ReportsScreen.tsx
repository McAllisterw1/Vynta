"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";

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
  name: string;
  rating: number;
  reviewCount: number;
}

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

export default function ReportsScreen({ plan }: { plan?: string | null } = {}) {
  const { user } = useUser();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    let competitors: Competitor[] = [];

    try {
      const stats = JSON.parse(localStorage.getItem("vynta_stats") || "{}") as { totalReviews?: number; avgRating?: number };
      totalReviews = stats.totalReviews ?? 0;
      avgRating = stats.avgRating ?? 0;
    } catch {}

    try { requestsSent = parseInt(localStorage.getItem("vynta_requests_sent") ?? "0", 10) || 0; } catch {}

    try {
      const history = JSON.parse(localStorage.getItem("vynta_response_history") || "[]") as unknown[];
      aiResponsesGenerated = history.length;
    } catch {}

    try {
      const ourReviews = JSON.parse(localStorage.getItem("vynta_our_reviews") || "[]") as Array<{ responded: boolean }>;
      reviewsFromVynta = ourReviews.length;
    } catch {}

    try { businessName = localStorage.getItem("vynta_default_business") ?? "My Business"; } catch {}

    try {
      competitors = JSON.parse(localStorage.getItem("vynta_competitors") || "[]") as Competitor[];
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
          competitors,
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
                      color: "#2D9B8A",
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
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D9B8A" }}>
                    AI Summary
                  </p>
                </div>
                <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.7 }}>
                  {selectedReport.aiSummary}
                </p>
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
                  <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.7 }}>
                    {selectedReport.competitorComparison}
                  </p>
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
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#2D9B8A" }}>
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
      </div>
      </UpgradeTooltip>
    </div>
  );
}
