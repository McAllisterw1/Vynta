"use client";

import { useState, useEffect } from "react";
import { calculateRevenueAtRisk, formatCurrency, type RevenueInputs, type RevenueEstimate } from "@/lib/revenueCalc";

const TEAL  = "#2D9B8A";
const DARK  = "#2C1A0E";
const AMBER = "#C4874A";
const MUTED = "#A0856A";
const RED   = "#DC2626";

const FIELD: React.CSSProperties = {
  background: "white",
  borderRadius: "10px",
  border: "none",
  boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
  padding: "11px 14px",
  fontSize: "13px",
  color: DARK,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const LABEL: React.CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: MUTED,
  fontWeight: 600,
  display: "block",
  marginBottom: "5px",
};

export interface RevenueProfile {
  avgCustomerValue: number | null;
  monthlyNewCustomers: number | null;
  googleTrafficPercent: number | null;
  targetRating: number | null;
  repeatCustomersPerYear: number | null;
  grossMarginPercent: number | null;
}

function NumericInput({
  value, onChange, placeholder, prefix, suffix, min, max, step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: MUTED, pointerEvents: "none" }}>
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step ?? 1}
        style={{ ...FIELD, paddingLeft: prefix ? "26px" : "14px", paddingRight: suffix ? "36px" : "14px" }}
      />
      {suffix && (
        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: MUTED, pointerEvents: "none" }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function LiveEstimate({ estimate, ratingGap }: { estimate: RevenueEstimate | null; ratingGap: number }) {
  if (!estimate || (estimate.monthlyLow === 0 && estimate.monthlyHigh === 0)) return null;

  const confColor = estimate.confidence === "high" ? TEAL : AMBER;
  const confLabel = estimate.confidence === "high" ? "Higher confidence" : "Directional estimate";

  return (
    <div style={{
      background: "rgba(220,38,38,0.04)",
      border: "1px solid rgba(220,38,38,0.15)",
      borderRadius: "12px",
      padding: "16px",
      marginTop: "4px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: RED }}>
          Estimated Revenue at Risk
        </p>
        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: `${confColor}18`, color: confColor, letterSpacing: "0.06em" }}>
          {confLabel}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
          <p style={{ fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Monthly</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: RED, lineHeight: 1 }}>
            {formatCurrency(estimate.monthlyLow)}–{formatCurrency(estimate.monthlyHigh)}
          </p>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
          <p style={{ fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Annual</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: RED, lineHeight: 1 }}>
            {formatCurrency(estimate.annualLow)}–{formatCurrency(estimate.annualHigh)}
          </p>
        </div>
      </div>

      {estimate.profitMonthlyLow != null && estimate.profitMonthlyHigh != null && (
        <div style={{ background: "white", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "11px", color: MUTED }}>Profit at risk / month</p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: AMBER }}>
            {formatCurrency(estimate.profitMonthlyLow)}–{formatCurrency(estimate.profitMonthlyHigh)}
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <p style={{ fontSize: "10px", color: MUTED, lineHeight: 1.5 }}>
          <span style={{ color: DARK, fontWeight: 600 }}>~{formatCurrency(estimate.reviewInfluencedMonthly)}/mo</span> of your new revenue is influenced by online reviews.
          {ratingGap > 0 && (
            <> Bridging your <span style={{ color: DARK, fontWeight: 600 }}>{ratingGap.toFixed(1)}★ rating gap</span> to {estimate.ratingGap > 0 ? "your target" : ""} could recover this range.</>
          )}
        </p>
        {estimate.ltv && (
          <p style={{ fontSize: "10px", color: MUTED }}>
            With repeat visits, average customer lifetime value is <span style={{ color: DARK, fontWeight: 600 }}>{formatCurrency(estimate.ltv)}</span>.
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  currentRating: number | null;
  unrespondedCount: number;
  initialProfile: RevenueProfile;
  onSave: (profile: RevenueProfile) => void;
  onClose: () => void;
}

export default function RevenueCalculator({ currentRating, unrespondedCount, initialProfile, onSave, onClose }: Props) {
  const [acv,       setAcv]       = useState(initialProfile.avgCustomerValue?.toString() ?? "");
  const [mnc,       setMnc]       = useState(initialProfile.monthlyNewCustomers?.toString() ?? "");
  const [gtp,       setGtp]       = useState(initialProfile.googleTrafficPercent?.toString() ?? "60");
  const [target,    setTarget]    = useState(initialProfile.targetRating?.toString() ?? "4.5");
  const [repeat,    setRepeat]    = useState(initialProfile.repeatCustomersPerYear?.toString() ?? "");
  const [margin,    setMargin]    = useState(initialProfile.grossMarginPercent?.toString() ?? "");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [estimate,  setEstimate]  = useState<RevenueEstimate | null>(null);

  const rating = currentRating ?? 4.0;

  useEffect(() => {
    const acvN    = parseFloat(acv);
    const mncN    = parseInt(mnc, 10);
    const gtpN    = parseInt(gtp, 10);
    const targetN = parseFloat(target);

    if (!acvN || !mncN || !gtpN || !targetN) { setEstimate(null); return; }

    const inputs: RevenueInputs = {
      avgCustomerValue:       acvN,
      monthlyNewCustomers:    mncN,
      googleTrafficPercent:   Math.min(100, Math.max(0, gtpN)),
      targetRating:           targetN,
      currentRating:          rating,
      repeatCustomersPerYear: repeat ? parseInt(repeat, 10) : undefined,
      grossMarginPercent:     margin ? parseInt(margin, 10) : undefined,
      unrespondedCount,
    };

    setEstimate(calculateRevenueAtRisk(inputs));
  }, [acv, mnc, gtp, target, repeat, margin, rating, unrespondedCount]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const profile: RevenueProfile = {
      avgCustomerValue:       parseFloat(acv) || null,
      monthlyNewCustomers:    parseInt(mnc, 10) || null,
      googleTrafficPercent:   parseInt(gtp, 10) || null,
      targetRating:           parseFloat(target) || null,
      repeatCustomersPerYear: repeat ? parseInt(repeat, 10) : null,
      grossMarginPercent:     margin ? parseInt(margin, 10) : null,
    };
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      onSave(profile);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch {}
    setSaving(false);
  }

  const canSave = !!parseFloat(acv) && !!parseInt(mnc, 10) && !!parseInt(gtp, 10) && !!parseFloat(target);
  const ratingGap = Math.max(0, parseFloat(target || "4.5") - rating);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(44,26,14,0.45)",
          zIndex: 100, backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 101,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "24px 16px 60px",
      }}>
        <div style={{
          background: "#FAF6F0", borderRadius: "20px", width: "100%", maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(44,26,14,0.25)",
          padding: "24px",
        }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: TEAL, marginBottom: "4px" }}>
                Revenue Profile
              </p>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: DARK, margin: 0 }}>Revenue at Risk Calculator</h2>
              <p style={{ fontSize: "12px", color: MUTED, marginTop: "4px", lineHeight: 1.5 }}>
                Helps Vynta AI give you estimates grounded in your actual business numbers.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "20px", lineHeight: 1, padding: "2px", flexShrink: 0, marginLeft: "12px" }}
            >
              ×
            </button>
          </div>

          {/* Current rating context */}
          {currentRating !== null && (
            <div style={{ background: "#E8DCC8", borderRadius: "10px", padding: "10px 14px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "11px", color: MUTED }}>Your current Google rating</p>
              <p style={{ fontSize: "13px", fontWeight: 700, color: ratingGap > 0 ? RED : TEAL }}>
                {currentRating.toFixed(1)}★
                {ratingGap > 0 && <span style={{ fontSize: "10px", fontWeight: 600, color: MUTED, marginLeft: "6px" }}>{ratingGap.toFixed(1)}★ gap to target</span>}
              </p>
            </div>
          )}

          {/* Required fields */}
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: DARK, marginBottom: "12px" }}>
            Required
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>

            <div>
              <label style={LABEL}>Average Customer Value</label>
              <p style={{ fontSize: "10px", color: MUTED, marginBottom: "6px" }}>Average revenue per customer visit, job, or appointment</p>
              <NumericInput value={acv} onChange={setAcv} placeholder="150" prefix="$" min={0} />
            </div>

            <div>
              <label style={LABEL}>Monthly New Customers</label>
              <p style={{ fontSize: "10px", color: MUTED, marginBottom: "6px" }}>Approximate number of new customers per month</p>
              <NumericInput value={mnc} onChange={setMnc} placeholder="40" min={0} />
            </div>

            <div>
              <label style={LABEL}>New Customers from Google / Online Reviews</label>
              <p style={{ fontSize: "10px", color: MUTED, marginBottom: "6px" }}>What % of your new customers find you through Google or reviews?</p>
              <NumericInput value={gtp} onChange={setGtp} placeholder="60" suffix="%" min={0} max={100} />
            </div>

            <div>
              <label style={LABEL}>Target Google Rating</label>
              <p style={{ fontSize: "10px", color: MUTED, marginBottom: "6px" }}>What rating are you working toward?</p>
              <NumericInput value={target} onChange={setTarget} placeholder="4.5" min={1} max={5} step={0.1} />
            </div>

          </div>

          {/* Optional fields */}
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: "12px" }}>
            Optional — improves accuracy
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>

            <div>
              <label style={LABEL}>Repeat Customers per Year</label>
              <p style={{ fontSize: "10px", color: MUTED, marginBottom: "6px" }}>On average, how many times does a customer return per year? (e.g. 4)</p>
              <NumericInput value={repeat} onChange={setRepeat} placeholder="e.g. 4" min={1} />
            </div>

            <div>
              <label style={LABEL}>Gross Margin</label>
              <p style={{ fontSize: "10px", color: MUTED, marginBottom: "6px" }}>Your approximate gross margin — used to show profit at risk, not just revenue</p>
              <NumericInput value={margin} onChange={setMargin} placeholder="e.g. 60" suffix="%" min={0} max={100} />
            </div>

          </div>

          {/* Live estimate */}
          <LiveEstimate estimate={estimate} ratingGap={ratingGap} />

          {/* Disclaimer */}
          <p style={{ fontSize: "9px", color: MUTED, lineHeight: 1.5, marginTop: "12px", marginBottom: "16px" }}>
            Estimates are directional and based on published research (BrightLocal, Harvard Business Review). Not a guarantee of actual revenue impact.
          </p>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              width: "100%",
              background: saved ? TEAL : canSave ? DARK : "rgba(44,26,14,0.25)",
              color: "white",
              borderRadius: "12px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: !canSave || saving ? "not-allowed" : "pointer",
              transition: "background 200ms",
            }}
          >
            {saved ? "Saved ✓" : saving ? "Saving…" : "Save Revenue Profile"}
          </button>
        </div>
      </div>
    </>
  );
}
