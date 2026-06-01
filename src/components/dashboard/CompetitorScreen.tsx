"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Competitor {
  id: string;
  name: string;
  zipCode: string;
  rating: number;
  reviewCount: number;
  sentiment: string | null;
  trend: string | null;
  velocity: string | null;
  analysisText: string | null;
  lastAnalyzed: string | null;
  createdAt: string;
}

interface Sentiment {
  positive: number;
  neutral: number;
  negative: number;
}

interface LookupResult {
  businessName: string;
  rating: number | null;
  reviewCount: number | null;
}

interface ParsedAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

// ── Design tokens ─────────────────────────────────────────────────────────────

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
  padding: "11px 14px",
  fontSize: "13px",
  color: "#2C1A0E",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

// ── Helper functions ──────────────────────────────────────────────────────────

function trendBorderColor(trend: string | null): string {
  if (trend === "improving") return "#2D9B8A";
  if (trend === "stable")    return "#C4874A";
  if (trend === "declining") return "#DC2626";
  return "rgba(44,26,14,0.12)";
}

function weaknessToAction(weakness: string): string {
  const lower = weakness.toLowerCase();
  if (lower.includes("inconsisten"))
    return "Emphasize consistency — document your process and mention it in every review response.";
  if (lower.includes("volume") || lower.includes("scale"))
    return "Position your personal touch as the differentiator. Customers choose you for quality, not quantity.";
  if (lower.includes("differentiat") || lower.includes("standout") || lower.includes("distinct"))
    return "Build a clear brand story — give customers a compelling, memorable reason to choose you over them.";
  if (lower.includes("slow") || lower.includes("wait"))
    return "Highlight your speed and responsiveness in every review reply and marketing touchpoint.";
  if (lower.includes("price") || lower.includes("expensive") || lower.includes("cost"))
    return "Compete on value transparency — clearly show what customers receive for their investment.";
  if (lower.includes("communicat") || lower.includes("responsive") || lower.includes("follow"))
    return "Make proactive communication a brand promise — respond to every review within 24 hours.";
  if (lower.includes("quality") || lower.includes("standard"))
    return "Lean into quality storytelling — use review responses to highlight the high standards you hold.";
  if (lower.includes("staff") || lower.includes("team") || lower.includes("employ"))
    return "Make your team visible — great customer interactions become powerful social proof.";
  if (lower.includes("online") || lower.includes("digital") || lower.includes("web"))
    return "Strengthen your digital presence — an optimized profile and consistent responses build real authority.";
  if (lower.includes("loyal") || lower.includes("retain") || lower.includes("repeat"))
    return "Launch a simple loyalty follow-up — a thank-you message turns one-time buyers into regulars.";
  return "Their gap is your opening — actively promote the areas where they fall short.";
}

function generateRecommendations(analysis: ParsedAnalysis): string[] {
  const recs: string[] = [];
  analysis.weaknesses.slice(0, 2).forEach((w) => recs.push(weaknessToAction(w)));
  if (recs.length < 3 && analysis.strengths[0]) {
    const s = analysis.strengths[0].replace(/\.$/, "").trim();
    recs.push(`Raise your bar: ${s.charAt(0).toLowerCase()}${s.slice(1)}.`);
  }
  return recs.slice(0, 3);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

function TrashIcon({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: size, height: size }}>
      <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15H5.405a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z" />
    </svg>
  );
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 16 16" fill="currentColor"
          style={{ width: size, height: size, color: s <= Math.round(rating) ? "#C4874A" : "#C8B49A" }}>
          <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
        </svg>
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: string | null }) {
  if (!trend) return null;
  const cfg =
    trend === "improving" ? { label: "↑ Improving", bg: "rgba(45,155,138,0.12)",  color: "#2D9B8A" } :
    trend === "declining" ? { label: "↓ Declining", bg: "rgba(220,38,38,0.1)",    color: "#DC2626" } :
                            { label: "→ Stable",    bg: "rgba(196,135,74,0.12)",  color: "#C4874A" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: "20px", padding: "3px 9px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em" }}>
      {cfg.label}
    </span>
  );
}

function SentimentBars({ sentiment }: { sentiment: Sentiment }) {
  const bars = [
    { label: "Positive", value: sentiment.positive, color: "#2D9B8A" },
    { label: "Neutral",  value: sentiment.neutral,  color: "#A0856A" },
    { label: "Negative", value: sentiment.negative, color: "#DC2626" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {bars.map((b) => (
        <div key={b.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ fontSize: "11px", color: "#A0856A" }}>{b.label}</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#2C1A0E" }}>{b.value}%</span>
          </div>
          <div style={{ height: "5px", background: "rgba(44,26,14,0.08)", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${b.value}%`, background: b.color, borderRadius: "99px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompetitorScreen() {
  const [mounted, setMounted]           = useState(false);
  const [competitors, setCompetitors]   = useState<Competitor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [selected, setSelected]         = useState<Competitor | null>(null);
  const [analyzing, setAnalyzing]       = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [hoveredId, setHoveredId]       = useState<string | null>(null);

  // Add-rival form
  const [addName, setAddName]           = useState("");
  const [addZip, setAddZip]             = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [looking, setLooking]           = useState(false);
  const [addError, setAddError]         = useState("");
  const [adding, setAdding]             = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/user/competitors")
      .then((r) => r.json())
      .then((data: Competitor[]) => { if (Array.isArray(data)) setCompetitors(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function resetAddForm() {
    setAddName(""); setAddZip(""); setLookupResult(null);
    setAddError(""); setLooking(false); setAdding(false);
  }

  async function lookupBusiness() {
    if (!addName.trim() || !addZip.trim() || looking) return;
    setLooking(true);
    setAddError("");
    setLookupResult(null);
    try {
      const res = await fetch("/api/outscraper-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `${addName.trim()} ${addZip.trim()}` }),
      });
      const data = await res.json() as { businessName?: string | null; reviewCount?: number | null; starRating?: number | null; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Couldn't find that business.");
      setLookupResult({
        businessName: data.businessName ?? addName.trim(),
        rating: data.starRating ?? null,
        reviewCount: data.reviewCount ?? null,
      });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Couldn't find that business.");
    } finally {
      setLooking(false);
    }
  }

  async function addCompetitor() {
    if (!lookupResult || adding) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/user/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lookupResult.businessName,
          zipCode: addZip.trim(),
          rating: lookupResult.rating ?? 0,
          reviewCount: lookupResult.reviewCount ?? 0,
        }),
      });
      const json = await res.json() as Competitor & { error?: string };
      if (!res.ok) throw new Error(json.error ?? `Server error ${res.status}`);
      setCompetitors((prev) => [...prev, json]);
      setShowAdd(false);
      resetAddForm();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add competitor. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function runAnalysis(id: string) {
    setAnalyzing(id);
    setAnalyzeError("");
    try {
      const res = await fetch(`/api/user/competitors/${id}/analyze`, { method: "POST" });
      const json = await res.json() as Competitor & { error?: string };
      if (!res.ok) throw new Error(json.error ?? `Analysis failed (${res.status})`);
      setCompetitors((prev) => prev.map((c) => c.id === id ? json : c));
      if (selected?.id === id) setSelected(json);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed. Try again.");
    } finally {
      setAnalyzing(null);
    }
  }

  async function deleteCompetitor(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/user/competitors/${id}`, { method: "DELETE" });
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {}
    setDeleting(null);
  }

  const parseSentiment = (raw: string | null): Sentiment | null => {
    if (!raw) return null;
    try { return JSON.parse(raw) as Sentiment; } catch { return null; }
  };

  const parseAnalysis = (raw: string | null): ParsedAnalysis | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<ParsedAnalysis>;
      if (parsed.summary || parsed.strengths || parsed.weaknesses) {
        return {
          summary:    parsed.summary ?? "",
          strengths:  parsed.strengths ?? [],
          weaknesses: parsed.weaknesses ?? [],
        };
      }
    } catch {}
    return { summary: raw, strengths: [], weaknesses: [] };
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "#FAF5E8",
        padding: "14px 20px 10px", borderBottom: "1px solid rgba(44,26,14,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C1A0E" }}>Rivals</h1>
          <p style={{ fontSize: "11px", color: "#2D9B8A", marginTop: "1px" }}>Track and analyze your competition</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd(true); resetAddForm(); }}
          style={{ background: "#2D9B8A", color: "white", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "12px", height: "12px" }}>
            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
          </svg>
          Add Rival
        </button>
      </div>

      <div style={{ padding: "16px 20px 120px" }}>

        {/* ── Empty state ── */}
        {!loading && competitors.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px" }}>
            <div style={{
              width: "68px", height: "68px", borderRadius: "50%",
              background: "rgba(45,155,138,0.1)", display: "flex",
              alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
            }}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "30px", height: "30px", color: "#2D9B8A" }}>
                <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2h-4v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5h1ZM3.5 3h9A1.5 1.5 0 0 1 14 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-9A1.5 1.5 0 0 1 3.5 3Zm0 1a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-9ZM8 6.5A.75.75 0 0 1 8.75 7v1.25H10a.75.75 0 0 1 0 1.5H8.75V11a.75.75 0 0 1-1.5 0V9.75H6a.75.75 0 0 1 0-1.5h1.25V7A.75.75 0 0 1 8 6.5Z" />
              </svg>
            </div>
            <p className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
              No rivals tracked yet
            </p>
            <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.65, maxWidth: "260px", margin: "0 auto 24px" }}>
              Add your first rival to start tracking the competition — rating, velocity, sentiment, and AI-powered intel.
            </p>
            <button
              type="button"
              onClick={() => { setShowAdd(true); resetAddForm(); }}
              style={{ background: "#2D9B8A", color: "white", borderRadius: "12px", padding: "12px 26px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer" }}
            >
              Add your first rival →
            </button>
          </div>
        )}

        {/* ── Competitor cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {competitors.map((c) => {
            const sentiment  = parseSentiment(c.sentiment);
            const isHovered  = hoveredId === c.id;
            const isDeleting = deleting === c.id;

            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(c)}
                onKeyDown={(e) => e.key === "Enter" && setSelected(c)}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  ...CARD,
                  borderLeft: `4px solid ${trendBorderColor(c.trend)}`,
                  padding: "18px 16px 16px",
                  cursor: "pointer",
                  animation: "fadeUp 200ms both",
                  boxShadow: isHovered
                    ? "0 8px 28px rgba(44,26,14,0.15)"
                    : "0 2px 12px rgba(44,26,14,0.08)",
                  transform: isHovered ? "translateY(-2px)" : "none",
                  transition: "box-shadow 180ms, transform 180ms",
                  outline: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "9px" }}>
                  {/* Name + rating */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <StarDisplay rating={c.rating} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#2C1A0E" }}>{c.rating.toFixed(1)}</span>
                      <span style={{ fontSize: "11px", color: "#A0856A" }}>{c.reviewCount.toLocaleString()} reviews</span>
                    </div>
                  </div>

                  {/* Trash + chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); void deleteCompetitor(c.id); }}
                      disabled={isDeleting}
                      title="Remove rival"
                      style={{
                        background: "none", border: "none", padding: "5px 6px",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        color: "#C4A882", opacity: isDeleting ? 0.35 : 1,
                        lineHeight: 0, borderRadius: "6px", transition: "color 150ms",
                      }}
                      onMouseEnter={(e) => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = "#DC2626"; }}
                      onMouseLeave={(e) => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = "#C4A882"; }}
                    >
                      <TrashIcon size={14} />
                    </button>
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "13px", height: "13px", color: "#A0856A" }}>
                      <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Badge row */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {c.trend && <TrendBadge trend={c.trend} />}
                  {c.velocity && (
                    <span style={{ background: "rgba(44,26,14,0.06)", color: "#A0856A", borderRadius: "20px", padding: "3px 9px", fontSize: "10px", fontWeight: 600 }}>
                      {c.velocity}
                    </span>
                  )}
                  {sentiment && (
                    <span style={{ background: "rgba(45,155,138,0.1)", color: "#2D9B8A", borderRadius: "20px", padding: "3px 9px", fontSize: "10px", fontWeight: 600 }}>
                      😊 {sentiment.positive}% positive
                    </span>
                  )}
                  {!c.lastAnalyzed && (
                    <span style={{ background: "rgba(196,135,74,0.1)", color: "#C4874A", borderRadius: "20px", padding: "3px 9px", fontSize: "10px", fontWeight: 600 }}>
                      Not analyzed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add Rival modal ── */}
      {showAdd && mounted && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(44,26,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => { setShowAdd(false); resetAddForm(); }}
        >
          <div
            style={{ background: "#FAF5E8", borderRadius: "20px", width: "100%", maxWidth: "420px", maxHeight: "85vh", overflowY: "auto", padding: "24px", boxShadow: "0 8px 40px rgba(44,26,14,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>Add a Rival</h2>
            <p style={{ fontSize: "12px", color: "#2D9B8A", marginBottom: "18px", lineHeight: 1.5 }}>
              We&apos;ll look up their current rating and review count from Google.
            </p>

            {lookupResult ? (
              /* Step 2 — confirm */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(45,155,138,0.06)", border: "1px solid rgba(45,155,138,0.18)", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "8px" }}>Found on Google</p>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>{lookupResult.businessName}</p>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    {lookupResult.rating !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <StarDisplay rating={lookupResult.rating} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#2C1A0E" }}>{lookupResult.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {lookupResult.reviewCount !== null && (
                      <span style={{ fontSize: "12px", color: "#A0856A" }}>{lookupResult.reviewCount.toLocaleString()} reviews</span>
                    )}
                  </div>
                </div>
                {addError && <p style={{ fontSize: "11px", color: "#DC2626" }}>{addError}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => { setLookupResult(null); setAddError(""); }}
                    style={{ flex: 1, background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "10px", padding: "11px", fontSize: "13px", color: "#A0856A", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={addCompetitor}
                    disabled={adding}
                    style={{ flex: 2, background: adding ? "rgba(45,155,138,0.4)" : "#2D9B8A", color: "white", borderRadius: "10px", padding: "11px", fontSize: "13px", fontWeight: 700, border: "none", cursor: adding ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    {adding ? <><Spinner /> Adding…</> : "Add to Rivals"}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 1 — lookup */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  type="text" value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Competitor business name"
                  style={FIELD} autoFocus
                />
                <input
                  type="text" inputMode="numeric" maxLength={5} value={addZip}
                  onChange={(e) => setAddZip(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Their zip code"
                  style={FIELD}
                />
                {addError && <p style={{ fontSize: "11px", color: "#DC2626" }}>{addError}</p>}
                <button
                  type="button"
                  onClick={lookupBusiness}
                  disabled={!addName.trim() || !addZip.trim() || looking}
                  style={{
                    background: !addName.trim() || !addZip.trim() || looking ? "rgba(45,155,138,0.4)" : "#2D9B8A",
                    color: "white", borderRadius: "10px", padding: "12px",
                    fontSize: "13px", fontWeight: 700, border: "none",
                    cursor: !addName.trim() || !addZip.trim() || looking ? "not-allowed" : "pointer",
                    opacity: !addName.trim() || !addZip.trim() ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  {looking ? <><Spinner /> Looking up…</> : "Find Business"}
                </button>
              </div>
            )}
          </div>
        </div>
      , document.body)}

      {/* ── Detail drawer ── */}
      {selected && mounted && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(44,26,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setSelected(null)}
        >
          {/* Wrapper — position:relative so the scroll-fade sits on top */}
          <div
            style={{ position: "relative", width: "100%", maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable card */}
            <div style={{ background: "#FAF5E8", borderRadius: "20px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(44,26,14,0.2)" }}>

              {/* ── Sticky header ── */}
              <div style={{
                position: "sticky", top: 0, zIndex: 10, background: "#FAF5E8",
                padding: "18px 18px 14px", borderBottom: "1px solid rgba(44,26,14,0.07)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="font-display" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selected.name}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "4px", flexWrap: "wrap" }}>
                      <StarDisplay rating={selected.rating} size={13} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#2C1A0E" }}>{selected.rating.toFixed(1)}</span>
                      <span style={{ fontSize: "11px", color: "#A0856A" }}>{selected.reviewCount.toLocaleString()} reviews</span>
                      {selected.zipCode && <span style={{ fontSize: "11px", color: "#A0856A" }}>· {selected.zipCode}</span>}
                    </div>
                    {selected.trend && (
                      <div style={{ marginTop: "7px" }}>
                        <TrendBadge trend={selected.trend} />
                      </div>
                    )}
                  </div>

                  {/* Delete + close buttons — always visible */}
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0, marginTop: "1px" }}>
                    <button
                      type="button"
                      onClick={() => void deleteCompetitor(selected.id)}
                      disabled={deleting === selected.id}
                      title="Remove rival"
                      style={{
                        background: "rgba(220,38,38,0.07)", border: "none", borderRadius: "8px",
                        padding: "7px 8px", cursor: deleting === selected.id ? "not-allowed" : "pointer",
                        color: "#DC2626", lineHeight: 0, opacity: deleting === selected.id ? 0.4 : 1,
                        transition: "background 150ms",
                      }}
                    >
                      <TrashIcon size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      title="Close"
                      style={{ background: "rgba(44,26,14,0.06)", border: "none", borderRadius: "8px", padding: "7px 8px", cursor: "pointer", color: "#A0856A", lineHeight: 0 }}
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "13px", height: "13px" }}>
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Scrollable body ── */}
              <div style={{ padding: "16px 18px 28px" }}>

                {selected.lastAnalyzed ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                    {/* Sentiment bars */}
                    {parseSentiment(selected.sentiment) && (
                      <div style={{ ...CARD, padding: "14px" }}>
                        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "12px" }}>Sentiment Breakdown</p>
                        <SentimentBars sentiment={parseSentiment(selected.sentiment)!} />
                      </div>
                    )}

                    {/* Velocity + Trend grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {selected.velocity && (
                        <div style={{ ...CARD, padding: "12px 14px" }}>
                          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "4px" }}>Review Velocity</p>
                          <p style={{ fontSize: "15px", fontWeight: 700, color: "#2C1A0E" }}>{selected.velocity}</p>
                        </div>
                      )}
                      {selected.trend && (
                        <div style={{ ...CARD, padding: "12px 14px" }}>
                          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "4px" }}>Overall Trend</p>
                          <p style={{
                            fontSize: "15px", fontWeight: 700, textTransform: "capitalize",
                            color: selected.trend === "improving" ? "#2D9B8A" : selected.trend === "declining" ? "#DC2626" : "#C4874A",
                          }}>
                            {selected.trend}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Analysis narrative sections */}
                    {(() => {
                      const analysis = parseAnalysis(selected.analysisText);
                      if (!analysis) return null;
                      const recs = generateRecommendations(analysis);

                      return (
                        <>
                          {/* Vynta's Intel — distinct background + lightbulb icon */}
                          {analysis.summary && (
                            <div style={{ background: "rgba(45,155,138,0.06)", border: "1px solid rgba(45,155,138,0.16)", borderRadius: "14px", padding: "14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                {/* Lightbulb icon */}
                                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "13px", height: "13px", color: "#2D9B8A", flexShrink: 0 }}>
                                  <path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.572-.37-.877-.197-.286-.397-.552-.61-.819l-.217-.255C3.332 7.824 2.5 6.819 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.57-.832 2.574-1.494 3.365l-.216.255c-.214.267-.414.533-.61.82-.208.304-.33.595-.372.876a.75.75 0 0 1-1.484-.211c.084-.594.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
                                </svg>
                                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D9B8A", fontWeight: 700 }}>
                                  Vynta&apos;s Intel
                                </p>
                              </div>
                              <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.65 }}>{analysis.summary}</p>
                            </div>
                          )}

                          {/* What They Do Well */}
                          {analysis.strengths.length > 0 && (
                            <div style={{ ...CARD, padding: "14px", borderLeft: "3px solid #2D9B8A" }}>
                              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D9B8A", fontWeight: 600, marginBottom: "10px" }}>What They Do Well</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {analysis.strengths.map((s, i) => (
                                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                    <span style={{ color: "#2D9B8A", fontWeight: 700, fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>✓</span>
                                    <p style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.55, margin: 0 }}>{s}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Where They're Weak */}
                          {analysis.weaknesses.length > 0 && (
                            <div style={{ ...CARD, padding: "14px", borderLeft: "3px solid #DC2626" }}>
                              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#DC2626", fontWeight: 600, marginBottom: "10px" }}>Where They&apos;re Weak</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {analysis.weaknesses.map((w, i) => (
                                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                    <span style={{ color: "#DC2626", fontWeight: 700, fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>✗</span>
                                    <p style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.55, margin: 0 }}>{w}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommended Actions */}
                          {recs.length > 0 && (
                            <div style={{ background: "rgba(44,26,14,0.03)", border: "1px solid rgba(44,26,14,0.08)", borderRadius: "14px", padding: "14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                {/* Target/bullseye icon */}
                                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "12px", height: "12px", color: "#C4874A", flexShrink: 0 }}>
                                  <path d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7-6a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
                                </svg>
                                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#C4874A", fontWeight: 700 }}>
                                  Recommended Actions
                                </p>
                              </div>
                              <p style={{ fontSize: "10px", color: "#A0856A", marginBottom: "12px" }}>
                                Their gaps are your opportunities — here&apos;s where you can pull ahead
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {recs.map((rec, i) => (
                                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{
                                      width: "20px", height: "20px", borderRadius: "50%",
                                      background: "#C4874A", color: "white",
                                      fontSize: "10px", fontWeight: 700,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      flexShrink: 0, marginTop: "1px",
                                    }}>
                                      {i + 1}
                                    </span>
                                    <p style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.6, margin: 0 }}>{rec}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <p style={{ fontSize: "10px", color: "#A0856A", textAlign: "center" }}>
                      Last analyzed {timeAgo(selected.lastAnalyzed)}
                    </p>
                  </div>
                ) : (
                  <div style={{ ...CARD, padding: "22px", textAlign: "center", marginBottom: "6px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>No analysis yet</p>
                    <p style={{ fontSize: "11px", color: "#A0856A", lineHeight: 1.65 }}>
                      Run an analysis to see sentiment breakdown, review velocity, trend, and Vynta&apos;s competitive intel. Uses minimal credits.
                    </p>
                  </div>
                )}

                {/* ── Analyze / Refresh button ── */}
                {analyzeError && (
                  <p style={{ fontSize: "11px", color: "#DC2626", textAlign: "center", marginBottom: "8px", marginTop: "14px" }}>
                    {analyzeError}
                  </p>
                )}
                {(() => {
                  const hoursLeft = selected.lastAnalyzed
                    ? Math.ceil(24 - (Date.now() - new Date(selected.lastAnalyzed).getTime()) / 3600000)
                    : 0;
                  const throttled = hoursLeft > 0;
                  const busy      = analyzing === selected.id;
                  const disabled  = busy || throttled;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => !disabled && runAnalysis(selected.id)}
                        disabled={disabled}
                        style={{
                          width: "100%", marginTop: "14px", marginBottom: throttled ? "6px" : "0px",
                          background: disabled ? "rgba(44,26,14,0.08)" : "#2D9B8A",
                          color: disabled ? "#A0856A" : "white",
                          borderRadius: "12px", padding: "13px",
                          fontSize: "13px", fontWeight: 700, border: "none",
                          cursor: disabled ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          transition: "background 150ms",
                        }}
                      >
                        {busy
                          ? <><Spinner /> Analyzing…</>
                          : throttled
                          ? `Refresh in ${hoursLeft}h`
                          : selected.lastAnalyzed ? "Refresh Analysis" : "Run Analysis"}
                      </button>
                      {throttled && (
                        <p style={{ fontSize: "10px", color: "#A0856A", textAlign: "center" }}>
                          Analysis refreshes once every 24 hours
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Scroll-fade overlay — signals more content below */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "56px",
              background: "linear-gradient(to bottom, transparent, rgba(250,245,232,0.92))",
              borderRadius: "0 0 20px 20px", pointerEvents: "none",
            }} />
          </div>
        </div>
      , document.body)}
    </div>
  );
}
