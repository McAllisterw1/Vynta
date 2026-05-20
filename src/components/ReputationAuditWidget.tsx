"use client";

import { useState } from "react";

interface LookupResult {
  businessName: string;
  starRating: number | null;
  reviewCount: number | null;
}

interface PitchResult {
  score: number;
  hook: string;
  insight: string;
  solutions: string[];
  cta: string;
}

function scoreColor(score: number) {
  if (score < 50) return "#DC2626";
  if (score < 65) return "#D97706";
  if (score < 80) return "#CA8A04";
  return "#16A34A";
}

function scoreLabel(score: number) {
  if (score < 50) return "Needs urgent attention";
  if (score < 65) return "Falling behind competitors";
  if (score < 80) return "Good — room to grow";
  return "Strong reputation";
}

function StarDisplay({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= full;
        const partial = !filled && s === full + 1 && frac >= 0.5;
        return (
          <svg key={s} viewBox="0 0 16 16" style={{ width: "22px", height: "22px", color: filled || partial ? "#F59E0B" : "#D1D5DB" }} fill="currentColor">
            <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
          </svg>
        );
      })}
    </div>
  );
}

export default function ReputationAuditWidget() {
  const [businessName, setBusinessName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  const [error, setError] = useState("");

  const card: React.CSSProperties = {
    background: "#FAF5E8",
    borderRadius: "20px",
    boxShadow: "0 4px 32px rgba(44,26,14,0.1), 0 1px 8px rgba(44,26,14,0.06)",
    overflow: "hidden",
    textAlign: "left",
  };

  const input: React.CSSProperties = {
    width: "100%",
    background: "white",
    borderRadius: "10px",
    border: "1.5px solid #E8DCC8",
    padding: "13px 16px",
    fontSize: "15px",
    color: "#2C1A0E",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  async function runAudit() {
    if (!businessName.trim() || !zipCode.trim()) return;
    setStep("loading");
    setError("");
    setLoadingMsg("Looking up your Google presence…");

    try {
      // Step 1 — BrightLocal lookup
      const lookupRes = await fetch("/api/lookup-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), zipCode: zipCode.trim() }),
      });
      const lookupData = await lookupRes.json() as LookupResult & { error?: string };
      if (!lookupRes.ok || lookupData.error) {
        throw new Error(lookupData.error ?? "Couldn't find that business. Check the name and zip code.");
      }
      setLookup(lookupData);

      // Step 2 — Vynta pitch from Claude
      setLoadingMsg("Generating your personalised Vynta plan…");
      const pitchRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: lookupData.businessName,
          starRating: lookupData.starRating,
          reviewCount: lookupData.reviewCount,
        }),
      });
      const pitchData = await pitchRes.json() as PitchResult & { error?: string };
      if (!pitchRes.ok || pitchData.error) throw new Error("Couldn't generate your plan. Please try again.");
      setPitch(pitchData);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("form");
    }
  }

  function reset() {
    setStep("form");
    setBusinessName("");
    setZipCode("");
    setLookup(null);
    setPitch(null);
    setError("");
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div style={card}>
        <div style={{ padding: "28px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#2D9B8A", marginBottom: "6px" }}>
            Free Reputation Lookup
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            See your real Google numbers
          </p>
          <p style={{ fontSize: "13px", color: "#A0856A", marginBottom: "24px" }}>
            We pull your live rating and review count — then show you exactly how Vynta helps.
          </p>

          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "6px" }}>
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Apex Plumbing"
            style={{ ...input, marginBottom: "14px" }}
            onKeyDown={(e) => { if (e.key === "Enter" && zipCode.trim()) runAudit(); }}
          />

          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "6px" }}>
            Zip Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="e.g. 90210"
            style={{ ...input, marginBottom: "20px" }}
            onKeyDown={(e) => { if (e.key === "Enter" && businessName.trim()) runAudit(); }}
          />

          {error && (
            <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "12px", lineHeight: 1.5 }}>{error}</p>
          )}

          <button
            type="button"
            onClick={runAudit}
            disabled={!businessName.trim() || !zipCode.trim()}
            style={{
              width: "100%",
              background: businessName.trim() && zipCode.trim() ? "#2C1A0E" : "#A0856A",
              color: "white",
              borderRadius: "12px",
              padding: "15px",
              fontSize: "15px",
              fontWeight: 700,
              border: "none",
              cursor: businessName.trim() && zipCode.trim() ? "pointer" : "not-allowed",
              opacity: businessName.trim() && zipCode.trim() ? 1 : 0.6,
              transition: "background 150ms, opacity 150ms",
            }}
          >
            Look Up My Business →
          </button>
          <p style={{ fontSize: "11px", color: "#A0856A", textAlign: "center", marginTop: "10px" }}>
            No account needed · Takes about 15 seconds
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div style={{ ...card, padding: "56px 28px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "20px" }}>
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="animate-bounce"
              style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#2D9B8A", display: "inline-block", animationDelay: `${d}ms` }}
            />
          ))}
        </div>
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
          {loadingMsg}
        </p>
        <p style={{ fontSize: "13px", color: "#A0856A" }}>
          Pulling live data from Google for <strong>{businessName}</strong>
        </p>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (step === "results" && lookup && pitch) {
    const sc = scoreColor(pitch.score);
    return (
      <div style={card}>

        {/* Dark header — real data trust block */}
        <div style={{ background: "#2C1A0E", padding: "28px 28px 24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#A0856A", marginBottom: "4px" }}>
            Live Google Data · {lookup.businessName}
          </p>

          {/* Star rating + review count row */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px", marginTop: "16px", marginBottom: "20px" }}>
            {/* Rating block */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                Star Rating
              </p>
              <p style={{ fontSize: "48px", fontWeight: 800, color: "white", lineHeight: 1, marginBottom: "6px" }}>
                {lookup.starRating !== null ? lookup.starRating.toFixed(1) : "—"}
              </p>
              {lookup.starRating !== null && <StarDisplay rating={lookup.starRating} />}
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "70px", background: "rgba(255,255,255,0.1)" }} />

            {/* Review count block */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                Total Reviews
              </p>
              <p style={{ fontSize: "48px", fontWeight: 800, color: "white", lineHeight: 1, marginBottom: "6px" }}>
                {lookup.reviewCount !== null ? lookup.reviewCount.toLocaleString() : "—"}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>on Google</p>
            </div>
          </div>

          {/* Reputation score bar */}
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Reputation Score
                </span>
                <span style={{ fontSize: "10px", color: sc, fontWeight: 700 }}>
                  {scoreLabel(pitch.score)}
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "99px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "99px", background: sc, width: `${pitch.score}%`, transition: "width 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)" }} />
              </div>
            </div>
            <span style={{ fontSize: "22px", fontWeight: 800, color: sc, flexShrink: 0 }}>
              {pitch.score}
            </span>
          </div>
        </div>

        {/* Pitch body */}
        <div style={{ padding: "24px 28px 28px" }}>

          {/* Hook */}
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.3, marginBottom: "10px" }}>
            {pitch.hook}
          </p>

          {/* Insight */}
          <p style={{ fontSize: "13px", color: "#7B5E45", lineHeight: 1.7, marginBottom: "20px" }}>
            {pitch.insight}
          </p>

          {/* Solutions */}
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2D9B8A", marginBottom: "12px" }}>
            Here's exactly how Vynta helps you
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "22px" }}>
            {pitch.solutions.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2D9B8A", color: "white", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.6, margin: 0 }}>{s}</p>
              </div>
            ))}
          </div>

          {/* CTA line */}
          <p style={{ fontSize: "12px", color: "#A0856A", lineHeight: 1.6, marginBottom: "18px", fontStyle: "italic" }}>
            {pitch.cta}
          </p>

          {/* Buttons */}
          <a
            href="/sign-up"
            style={{
              display: "block", textAlign: "center",
              background: "#2D9B8A", color: "white",
              borderRadius: "12px", padding: "15px",
              fontSize: "15px", fontWeight: 700,
              textDecoration: "none", marginBottom: "10px",
            }}
          >
            Start Fixing This — Free Trial
          </a>
          <button
            type="button"
            onClick={reset}
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#A0856A", padding: "6px" }}
          >
            Look up a different business
          </button>
        </div>
      </div>
    );
  }

  return null;
}
