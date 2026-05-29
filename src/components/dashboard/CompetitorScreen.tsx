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

function Spinner() {
  return (
    <svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
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
  const cfg = trend === "improving"
    ? { label: "↑ Improving", bg: "rgba(45,155,138,0.12)", color: "#2D9B8A" }
    : trend === "declining"
    ? { label: "↓ Declining", bg: "rgba(220,38,38,0.1)", color: "#DC2626" }
    : { label: "→ Stable", bg: "rgba(45,155,138,0.1)", color: "#2D9B8A" };
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
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function CompetitorScreen() {
  const [mounted, setMounted]           = useState(false);
  const [competitors, setCompetitors]   = useState<Competitor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [selected, setSelected]         = useState<Competitor | null>(null);
  const [analyzing, setAnalyzing]       = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");
  const [deleting, setDeleting]         = useState<string | null>(null);

  // Add form state
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

  interface ParsedAnalysis {
    summary: string;
    strengths: string[];
    weaknesses: string[];
  }

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
    // Legacy plain-text fallback
    return { summary: raw, strengths: [], weaknesses: [] };
  };

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#FAF5E8", padding: "14px 20px 10px", borderBottom: "1px solid rgba(44,26,14,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C1A0E" }}>Rivals</h1>
          <p style={{ fontSize: "11px", color: "#2D9B8A", marginTop: "1px" }}>Track and analyze your competition</p>
        </div>
        <button type="button" onClick={() => { setShowAdd(true); resetAddForm(); }}
          style={{ background: "#2D9B8A", color: "white", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "12px", height: "12px" }}>
            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
          </svg>
          Add Rival
        </button>
      </div>

      <div style={{ padding: "16px 20px 120px" }}>

        {/* Empty state */}
        {!loading && competitors.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "14px" }}>🎯</div>
            <p className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>No rivals tracked yet</p>
            <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.6, marginBottom: "20px" }}>
              Add a competitor to see their rating, review velocity, sentiment breakdown, and how you stack up.
            </p>
            <button type="button" onClick={() => { setShowAdd(true); resetAddForm(); }}
              style={{ background: "#2D9B8A", color: "white", borderRadius: "12px", padding: "12px 24px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer" }}>
              Add your first rival →
            </button>
          </div>
        )}

        {/* Competitor cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {competitors.map((c) => {
            const sentiment = parseSentiment(c.sentiment);
            return (
              <button key={c.id} type="button" onClick={() => setSelected(c)}
                style={{ ...CARD, padding: "16px", textAlign: "left", border: "none", cursor: "pointer", width: "100%", animation: "fadeUp 200ms both" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <StarDisplay rating={c.rating} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#2C1A0E" }}>{c.rating.toFixed(1)}</span>
                      <span style={{ fontSize: "11px", color: "#A0856A" }}>{c.reviewCount.toLocaleString()} reviews</span>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px", color: "#A0856A", flexShrink: 0, marginTop: "2px" }}>
                    <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Analysis badges row */}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Add Competitor Modal ── */}
      {showAdd && mounted && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(44,26,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => { setShowAdd(false); resetAddForm(); }}>
          <div style={{ background: "#FAF5E8", borderRadius: "20px", width: "100%", maxWidth: "420px", maxHeight: "85vh", overflowY: "auto", padding: "24px", boxShadow: "0 8px 40px rgba(44,26,14,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>Add a Rival</h2>
            <p style={{ fontSize: "12px", color: "#2D9B8A", marginBottom: "18px", lineHeight: 1.5 }}>
              We'll look up their current rating and review count from Google.
            </p>

            {lookupResult ? (
              /* Step 2: Confirm */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(45,155,138,0.06)", border: "1px solid rgba(45,155,138,0.18)", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "8px" }}>Found on Google</p>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>{lookupResult.businessName}</p>
                  <div style={{ display: "flex", gap: "14px" }}>
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
                  <button type="button" onClick={() => { setLookupResult(null); setAddError(""); }}
                    style={{ flex: 1, background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "10px", padding: "11px", fontSize: "13px", color: "#A0856A", cursor: "pointer" }}>
                    Back
                  </button>
                  <button type="button" onClick={addCompetitor} disabled={adding}
                    style={{ flex: 2, background: adding ? "rgba(45,155,138,0.4)" : "#2D9B8A", color: "white", borderRadius: "10px", padding: "11px", fontSize: "13px", fontWeight: 700, border: "none", cursor: adding ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {adding ? <><Spinner /> Adding…</> : "Add to Rivals"}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 1: Lookup */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                  placeholder="Competitor business name" style={FIELD} autoFocus />
                <input type="text" inputMode="numeric" maxLength={5} value={addZip}
                  onChange={(e) => setAddZip(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Their zip code" style={FIELD} />
                {addError && <p style={{ fontSize: "11px", color: "#DC2626" }}>{addError}</p>}
                <button type="button" onClick={lookupBusiness}
                  disabled={!addName.trim() || !addZip.trim() || looking}
                  style={{
                    background: !addName.trim() || !addZip.trim() || looking ? "rgba(45,155,138,0.4)" : "#2D9B8A",
                    color: "white", borderRadius: "10px", padding: "12px",
                    fontSize: "13px", fontWeight: 700, border: "none",
                    cursor: !addName.trim() || !addZip.trim() || looking ? "not-allowed" : "pointer",
                    opacity: !addName.trim() || !addZip.trim() ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    marginTop: "4px",
                  }}>
                  {looking ? <><Spinner /> Looking up…</> : "Find Business"}
                </button>
              </div>
            )}
          </div>
        </div>
      , document.body)}

      {/* ── Competitor Detail Modal ── */}
      {selected && mounted && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(44,26,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#FAF5E8", borderRadius: "20px", width: "100%", maxWidth: "420px", maxHeight: "85vh", overflowY: "auto", padding: "24px", boxShadow: "0 8px 40px rgba(44,26,14,0.2)" }}
            onClick={(e) => e.stopPropagation()}>

            {/* Business header */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C1A0E", flex: 1 }}>{selected.name}</h2>
                <TrendBadge trend={selected.trend} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <StarDisplay rating={selected.rating} size={16} />
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#2C1A0E" }}>{selected.rating.toFixed(1)}</span>
                <span style={{ fontSize: "12px", color: "#A0856A" }}>{selected.reviewCount.toLocaleString()} reviews</span>
                {selected.zipCode && <span style={{ fontSize: "12px", color: "#A0856A" }}>· Zip {selected.zipCode}</span>}
              </div>
            </div>

            {/* Analysis content */}
            {selected.lastAnalyzed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>

                {/* Sentiment */}
                {parseSentiment(selected.sentiment) && (
                  <div style={{ ...CARD, padding: "14px" }}>
                    <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "12px" }}>Sentiment Breakdown</p>
                    <SentimentBars sentiment={parseSentiment(selected.sentiment)!} />
                  </div>
                )}

                {/* Stats row */}
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
                      <p style={{ fontSize: "15px", fontWeight: 700, color: selected.trend === "improving" ? "#2D9B8A" : selected.trend === "declining" ? "#DC2626" : "#2D9B8A", textTransform: "capitalize" }}>{selected.trend}</p>
                    </div>
                  )}
                </div>

                {/* Narrative */}
                {(() => {
                  const analysis = parseAnalysis(selected.analysisText);
                  if (!analysis) return null;
                  return (
                    <>
                      {analysis.summary && (
                        <div style={{ ...CARD, padding: "14px" }}>
                          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "8px" }}>Overview</p>
                          <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.65 }}>{analysis.summary}</p>
                        </div>
                      )}
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
                      {analysis.weaknesses.length > 0 && (
                        <div style={{ ...CARD, padding: "14px", borderLeft: "3px solid #DC2626" }}>
                          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#DC2626", fontWeight: 600, marginBottom: "10px" }}>Where They're Weak</p>
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
                    </>
                  );
                })()}

                <p style={{ fontSize: "10px", color: "#A0856A", textAlign: "center" }}>
                  Last analyzed {timeAgo(selected.lastAnalyzed)}
                </p>
              </div>
            ) : (
              <div style={{ ...CARD, padding: "20px", textAlign: "center", marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>No analysis yet</p>
                <p style={{ fontSize: "11px", color: "#A0856A", lineHeight: 1.6 }}>
                  Run an analysis to see sentiment breakdown, review velocity, trend, and Vynta's competitive intel. Uses minimal credits.
                </p>
              </div>
            )}

            {/* Analyze button */}
            {analyzeError && (
              <p style={{ fontSize: "11px", color: "#DC2626", textAlign: "center", marginBottom: "8px" }}>{analyzeError}</p>
            )}
            {(() => {
              const hoursLeft = selected.lastAnalyzed
                ? Math.ceil(24 - (Date.now() - new Date(selected.lastAnalyzed).getTime()) / 3600000)
                : 0;
              const throttled = hoursLeft > 0;
              const busy = analyzing === selected.id;
              const disabled = busy || throttled;
              return (
                <>
                  <button type="button"
                    onClick={() => !disabled && runAnalysis(selected.id)}
                    disabled={disabled}
                    style={{
                      width: "100%", marginBottom: "10px",
                      background: disabled ? "rgba(44,26,14,0.08)" : "#2D9B8A",
                      color: disabled ? "#A0856A" : "white",
                      borderRadius: "12px", padding: "13px",
                      fontSize: "13px", fontWeight: 700, border: "none",
                      cursor: disabled ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      transition: "background 150ms",
                    }}>
                    {busy
                      ? <><Spinner /> Analyzing…</>
                      : throttled
                      ? `Refresh in ${hoursLeft}h`
                      : selected.lastAnalyzed ? "Refresh Analysis" : "Run Analysis"}
                  </button>
                  {throttled && (
                    <p style={{ fontSize: "10px", color: "#A0856A", textAlign: "center", marginBottom: "10px", marginTop: "-6px" }}>
                      Analysis refreshes once every 24 hours
                    </p>
                  )}
                </>
              );
            })()}

            {/* Delete */}
            <button type="button"
              onClick={() => deleteCompetitor(selected.id)}
              disabled={deleting === selected.id}
              style={{ width: "100%", background: "none", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 600, color: "#DC2626", cursor: "pointer", opacity: deleting === selected.id ? 0.5 : 1 }}>
              {deleting === selected.id ? "Removing…" : "Remove Rival"}
            </button>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
