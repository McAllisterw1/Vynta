"use client";

import { useState } from "react";

const BUSINESS_TYPES = [
  { value: "plumber", label: "Plumber", icon: "🔧" },
  { value: "hvac", label: "HVAC", icon: "❄️" },
  { value: "electrician", label: "Electrician", icon: "⚡" },
  { value: "roofer", label: "Roofer", icon: "🏠" },
  { value: "landscaper", label: "Landscaper", icon: "🌿" },
  { value: "cleaner", label: "Cleaning", icon: "✨" },
  { value: "dentist", label: "Dentist", icon: "🦷" },
  { value: "salon", label: "Salon", icon: "💇" },
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "auto_repair", label: "Auto Repair", icon: "🚗" },
  { value: "pest_control", label: "Pest Control", icon: "🐛" },
  { value: "contractor", label: "Contractor", icon: "🔨" },
  { value: "painter", label: "Painter", icon: "🎨" },
  { value: "flooring", label: "Flooring", icon: "🪵" },
  { value: "pool_service", label: "Pool Service", icon: "🏊" },
  { value: "locksmith", label: "Locksmith", icon: "🔑" },
  { value: "moving", label: "Moving", icon: "📦" },
  { value: "junk_removal", label: "Junk Removal", icon: "🗑️" },
  { value: "pressure_washing", label: "Pressure Washing", icon: "💦" },
  { value: "window_cleaning", label: "Window Cleaning", icon: "🪟" },
  { value: "appliance_repair", label: "Appliance Repair", icon: "🫧" },
  { value: "garage_door", label: "Garage Door", icon: "🚪" },
  { value: "solar", label: "Solar", icon: "☀️" },
  { value: "insulation", label: "Insulation", icon: "🧱" },
  { value: "chimney", label: "Chimney", icon: "🏚️" },
  { value: "tree_service", label: "Tree Service", icon: "🌳" },
  { value: "irrigation", label: "Irrigation", icon: "💧" },
  { value: "fencing", label: "Fencing", icon: "🪝" },
  { value: "concrete", label: "Concrete", icon: "🏗️" },
  { value: "remodeling", label: "Remodeling", icon: "🛠️" },
  { value: "chiropractic", label: "Chiropractic", icon: "🦴" },
  { value: "physical_therapy", label: "Physical Therapy", icon: "🏃" },
  { value: "veterinary", label: "Veterinary", icon: "🐾" },
  { value: "optometry", label: "Optometry", icon: "👁️" },
  { value: "med_spa", label: "Med Spa", icon: "💆" },
  { value: "tattoo", label: "Tattoo Shop", icon: "🖊️" },
  { value: "nail_salon", label: "Nail Salon", icon: "💅" },
  { value: "barber", label: "Barber", icon: "✂️" },
  { value: "gym", label: "Gym / Fitness", icon: "🏋️" },
  { value: "yoga", label: "Yoga Studio", icon: "🧘" },
  { value: "daycare", label: "Daycare", icon: "🧸" },
  { value: "tutoring", label: "Tutoring", icon: "📚" },
  { value: "photography", label: "Photography", icon: "📷" },
  { value: "catering", label: "Catering", icon: "🍱" },
  { value: "food_truck", label: "Food Truck", icon: "🚚" },
  { value: "bakery", label: "Bakery", icon: "🥐" },
  { value: "auto_detailing", label: "Auto Detailing", icon: "🪣" },
  { value: "towing", label: "Towing", icon: "🚛" },
  { value: "tax_prep", label: "Tax Prep", icon: "🧾" },
  { value: "real_estate", label: "Real Estate", icon: "🏡" },
];

interface AuditResult {
  score: number;
  headline: string;
  findings: string[];
  recommendation: string;
  urgency: string;
}

function scoreLabel(score: number) {
  if (score < 50) return { label: "Losing customers daily", color: "#DC2626" };
  if (score < 65) return { label: "Falling behind competitors", color: "#D97706" };
  if (score < 80) return { label: "Almost there, not quite", color: "#CA8A04" };
  return { label: "Strong reputation", color: "#16A34A" };
}

function scoreColor(score: number) {
  if (score < 50) return "#DC2626";
  if (score < 65) return "#D97706";
  if (score < 80) return "#CA8A04";
  return "#16A34A";
}

export default function ReputationAuditWidget() {
  const [step, setStep] = useState<"select" | "details" | "loading" | "results">("select");
  const [businessType, setBusinessType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ratingWhole, setRatingWhole] = useState("");
  const [ratingDecimal, setRatingDecimal] = useState("");
  const [reviewCount, setReviewCount] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  function buildRating(): number | null {
    const w = ratingWhole.trim();
    const d = ratingDecimal.trim();
    if (!w && !d) return null;
    const whole = parseInt(w || "4", 10);
    const dec = parseInt(d || "0", 10);
    const val = parseFloat(`${whole}.${dec}`);
    return isNaN(val) ? null : Math.min(5, Math.max(1, val));
  }

  async function runAudit() {
    setStep("loading");
    setError("");
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          businessName: businessName.trim() || undefined,
          starRating: buildRating(),
          reviewCount: reviewCount !== "" ? parseInt(reviewCount, 10) : null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json() as AuditResult;
      setResult(data);
      setStep("results");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("details");
    }
  }

  function reset() {
    setStep("select");
    setBusinessType("");
    setBusinessName("");
    setRatingWhole("");
    setRatingDecimal("");
    setReviewCount("");
    setResult(null);
    setError("");
  }

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
    padding: "12px 16px",
    fontSize: "14px",
    color: "#2C1A0E",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  // ── Step: Select business type ──────────────────────────────────────────────
  if (step === "select") {
    return (
      <div style={card}>
        <div style={{ padding: "28px 28px 0" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#2D9B8A", marginBottom: "6px" }}>
            Step 1 of 2
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            What type of business are you?
          </p>
          <p style={{ fontSize: "13px", color: "#A0856A", marginBottom: "16px" }}>
            Pick your category to get a personalised audit.
          </p>
        </div>

        {/* Scrollable grid */}
        <div style={{ maxHeight: "420px", overflowY: "auto", padding: "0 28px 4px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {BUSINESS_TYPES.map((bt) => (
              <button
                key={bt.value}
                type="button"
                onClick={() => { setBusinessType(bt.value); setStep("details"); }}
                style={{
                  background: "#E8DCC8",
                  border: "2px solid transparent",
                  borderRadius: "10px",
                  padding: "10px 6px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2D9B8A"; (e.currentTarget as HTMLElement).style.background = "rgba(45,155,138,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.background = "#E8DCC8"; }}
              >
                <span style={{ fontSize: "20px", lineHeight: 1 }}>{bt.icon}</span>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#2C1A0E", textAlign: "center", lineHeight: 1.2 }}>{bt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 28px 28px" }} />
      </div>
    );
  }

  // ── Step: Details ────────────────────────────────────────────────────────────
  if (step === "details") {
    const selected = BUSINESS_TYPES.find((b) => b.value === businessType);
    return (
      <div style={card}>
        <div style={{ padding: "28px" }}>
          <button
            type="button"
            onClick={() => setStep("select")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#A0856A", marginBottom: "16px", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
          >
            ← Back
          </button>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#2D9B8A", marginBottom: "6px" }}>
            Step 2 of 2
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            {selected?.icon} {selected?.label} — tell us where you stand
          </p>
          <p style={{ fontSize: "13px", color: "#A0856A", marginBottom: "24px" }}>
            Just estimate — no need to look anything up.
          </p>

          {/* Business name */}
          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "6px" }}>
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Apex Plumbing"
            style={{ ...input, marginBottom: "20px" }}
          />

          {/* Google Rating — two boxes with period */}
          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "10px" }}>
            Google Rating
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={ratingWhole}
              onChange={(e) => setRatingWhole(e.target.value.replace(/[^1-5]/g, ""))}
              placeholder="4"
              style={{ ...input, width: "64px", textAlign: "center", fontSize: "22px", fontWeight: 700, padding: "10px 8px" }}
            />
            <span style={{ fontSize: "26px", fontWeight: 700, color: "#2C1A0E", lineHeight: 1 }}>.</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={ratingDecimal}
              onChange={(e) => setRatingDecimal(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="7"
              style={{ ...input, width: "64px", textAlign: "center", fontSize: "22px", fontWeight: 700, padding: "10px 8px" }}
            />
            <span style={{ fontSize: "13px", color: "#A0856A", marginLeft: "4px" }}>out of 5 — just guess</span>
          </div>

          {/* Review count — two boxes */}
          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "10px" }}>
            Number of Reviews
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={reviewCount}
              onChange={(e) => setReviewCount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="25"
              style={{ ...input, width: "90px", textAlign: "center", fontSize: "22px", fontWeight: 700, padding: "10px 8px" }}
            />
            <span style={{ fontSize: "13px", color: "#A0856A" }}>reviews — ballpark is fine</span>
          </div>

          {error && <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "12px" }}>{error}</p>}

          <button
            type="button"
            onClick={runAudit}
            style={{
              width: "100%",
              background: "#2C1A0E",
              color: "white",
              borderRadius: "12px",
              padding: "15px",
              fontSize: "15px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Run My Free Audit →
          </button>
          <p style={{ fontSize: "11px", color: "#A0856A", textAlign: "center", marginTop: "10px" }}>
            No account required. Results in ~10 seconds.
          </p>
        </div>
      </div>
    );
  }

  // ── Step: Loading ────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div style={{ ...card, padding: "56px 28px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "20px" }}>
          {[0, 150, 300].map((d) => (
            <span key={d} className="animate-bounce" style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#2D9B8A", display: "inline-block", animationDelay: `${d}ms` }} />
          ))}
        </div>
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#2C1A0E", marginBottom: "6px" }}>
          Analysing your reputation…
        </p>
        <p style={{ fontSize: "13px", color: "#A0856A" }}>
          Checking rating signals, review velocity, and competitive gaps.
        </p>
      </div>
    );
  }

  // ── Step: Results ────────────────────────────────────────────────────────────
  if (step === "results" && result) {
    const { label, color } = scoreLabel(result.score);
    const sc = scoreColor(result.score);
    return (
      <div style={card}>
        {/* Score header */}
        <div style={{ background: "#2C1A0E", padding: "32px 28px 28px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#A0856A", marginBottom: "16px" }}>
            Reputation Score
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
            <span style={{ fontFamily: "inherit", fontSize: "72px", fontWeight: 800, color: sc, lineHeight: 1 }}>
              {result.score}
            </span>
            <span style={{ fontSize: "28px", color: "#A0856A", fontWeight: 300 }}>/100</span>
          </div>
          <span style={{
            display: "inline-block",
            background: color + "22",
            color: color,
            borderRadius: "20px",
            padding: "5px 16px",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}>
            {label}
          </span>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "white", marginTop: "16px", lineHeight: 1.3 }}>
            {result.headline}
          </p>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {/* Findings */}
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0856A", marginBottom: "12px" }}>
            What we found
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {result.findings.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", background: "#DC2626", color: "white", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}>
                  !
                </span>
                <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.6, margin: 0 }}>{f}</p>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div style={{ background: "rgba(45,155,138,0.1)", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", borderLeft: "3px solid #2D9B8A" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#2D9B8A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Your next step</p>
            <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.6, margin: 0 }}>{result.recommendation}</p>
          </div>

          {/* Urgency */}
          <p style={{ fontSize: "12px", color: "#A0856A", lineHeight: 1.6, marginBottom: "24px", fontStyle: "italic" }}>
            {result.urgency}
          </p>

          {/* CTAs */}
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
            Fix This With Vynta — Free Trial
          </a>
          <button
            type="button"
            onClick={reset}
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#A0856A", padding: "6px" }}
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return null;
}
