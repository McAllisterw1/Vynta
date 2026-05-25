"use client";

import { useState } from "react";

interface InitialSettings {
  businessName: string;
  businessType: string;
  businessAddress: string;
  businessUrl: string;
  businessPhone: string;
  googleReviewUrl: string;
  defaultTone: string;
  messageTemplate: string;
}

interface LookupResult {
  businessName: string;
  reviewCount: number | null;
  starRating: number | null;
}

interface Props {
  firstName: string;
  initialSettings: InitialSettings;
  hasSmartInbox: boolean;
  onDone: () => void;
}

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly",     label: "Friendly" },
  { value: "apologetic",   label: "Apologetic" },
  { value: "savage",       label: "Savage" },
  { value: "hypeman",      label: "Hype Man" },
  { value: "unbothered",   label: "Unbothered" },
  { value: "storyteller",  label: "Storyteller" },
  { value: "bythenumbers", label: "By The Numbers" },
  { value: "neighbor",     label: "Neighbor" },
  { value: "corporate",    label: "Corporate" },
];

const BUSINESS_TYPES = [
  "Plumber", "HVAC", "Electrician", "Roofer", "Landscaper", "Cleaning",
  "Dentist", "Salon", "Restaurant", "Auto Repair", "Pest Control",
  "Contractor", "Painter", "Flooring", "Pool Service", "Locksmith",
  "Moving", "Junk Removal", "Pressure Washing", "Barber", "Gym / Fitness",
  "Veterinary", "Med Spa", "Tattoo Shop", "Nail Salon", "Bakery",
  "Catering", "Photography", "Real Estate", "Tax Prep", "Other",
];

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

const LABEL: React.CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#A0856A",
  fontWeight: 600,
  display: "block",
  marginBottom: "6px",
};

const STEPS = ["Business", "Review Tools", "Smart Inbox"];

function Spinner() {
  return (
    <svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

export default function OnboardingWizard({ firstName, initialSettings, hasSmartInbox, onDone }: Props) {
  // step: 0=welcome 1=business 2=tools 3=inbox 4=done
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Business Profile
  const [businessName, setBusinessName]       = useState(initialSettings.businessName);
  const [businessType, setBusinessType]       = useState(initialSettings.businessType);
  const [businessAddress, setBusinessAddress] = useState(initialSettings.businessAddress);
  const [businessUrl, setBusinessUrl]         = useState(initialSettings.businessUrl);
  const [businessPhone, setBusinessPhone]     = useState(initialSettings.businessPhone);

  // Step 2 — Review Tools
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialSettings.googleReviewUrl);
  const [defaultTone, setDefaultTone]         = useState(initialSettings.defaultTone || "professional");
  const [messageTemplate, setMessageTemplate] = useState(initialSettings.messageTemplate);

  // Step 3 — Smart Inbox
  const [inboxName, setInboxName]         = useState("");
  const [inboxZip, setInboxZip]           = useState("");
  const [inboxPlaceId, setInboxPlaceId]   = useState("");
  const [inboxLooking, setInboxLooking]   = useState(false);
  const [inboxActivating, setInboxActivating] = useState(false);
  const [inboxError, setInboxError]       = useState("");
  const [lookupResult, setLookupResult]   = useState<LookupResult | null>(null);
  const [verifyChecked, setVerifyChecked] = useState(false);
  const [inboxDone, setInboxDone]         = useState(hasSmartInbox);

  async function saveStep1() {
    setSaving(true);
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType,
          businessAddress: businessAddress.trim(),
          businessUrl: businessUrl.trim(),
          businessPhone: businessPhone.trim(),
        }),
      });
    } catch {}
    setSaving(false);
    setStep(2);
  }

  async function saveStep2() {
    setSaving(true);
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleReviewUrl: googleReviewUrl.trim(),
          defaultTone,
          messageTemplate: messageTemplate.trim(),
        }),
      });
    } catch {}
    setSaving(false);
    setStep(3);
  }

  async function lookupBusiness() {
    if (!inboxPlaceId.trim() || inboxLooking) return;
    setInboxLooking(true);
    setInboxError("");
    setLookupResult(null);
    setVerifyChecked(false);
    try {
      const res = await fetch("/api/outscraper-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: inboxPlaceId.trim() }),
      });
      const data = await res.json() as { businessName?: string | null; reviewCount?: number | null; starRating?: number | null; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Couldn't find that business.");
      setLookupResult({
        businessName: (data.businessName ?? inboxName.trim()) || inboxPlaceId.trim(),
        reviewCount: data.reviewCount ?? null,
        starRating: data.starRating ?? null,
      });
    } catch (err) {
      setInboxError(err instanceof Error ? err.message : "Couldn't find that business. Check your Place ID.");
    } finally {
      setInboxLooking(false);
    }
  }

  async function confirmAndActivate() {
    if (!lookupResult || !verifyChecked || inboxActivating) return;
    setInboxActivating(true);
    setInboxError("");
    try {
      const count = lookupResult.reviewCount ?? 0;
      const now = new Date().toISOString();
      await fetch("/api/user/smart-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: lookupResult.businessName,
          zipCode: inboxZip.trim() || "",
          placeId: inboxPlaceId.trim() || undefined,
          baselineCount: count,
          lastKnownCount: count,
          lastChecked: now,
          setupDate: now,
          enabled: true,
          verified: true,
        }),
      });
      setInboxDone(true);
      setLookupResult(null);
    } catch (err) {
      setInboxError(err instanceof Error ? err.message : "Activation failed. Please try again.");
    } finally {
      setInboxActivating(false);
    }
  }

  async function complete() {
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });
    } catch {}
    onDone();
  }

  async function dismiss() {
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });
    } catch {}
    onDone();
  }

  const progressStep = step >= 1 && step <= 3 ? step - 1 : null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(44,26,14,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{
        background: "#FAF5E8",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "420px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 24px 60px rgba(44,26,14,0.22)",
        animation: "fadeUp 280ms cubic-bezier(0.25,0.46,0.45,0.94) both",
      }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <svg viewBox="0 0 62 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: "14px", width: "auto" }}>
              <path d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
                stroke="#C4874A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="5"  cy="3" r="2" fill="#C4874A" />
              <circle cx="17" cy="3" r="2" fill="#C4874A" />
              <circle cx="29" cy="3" r="2" fill="#C4874A" />
              <circle cx="41" cy="3" r="2" fill="#C4874A" />
              <circle cx="53" cy="3" r="2" fill="#C4874A" />
            </svg>
            <span className="font-display" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2C1A0E" }}>Vynta</span>
          </div>
          {step > 0 && (
            <button type="button" onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#A0856A" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress dots — visible on steps 1–3 */}
        {progressStep !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "16px 20px 0" }}>
            {STEPS.map((label, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: i < progressStep ? "#4F46E5" : i === progressStep ? "#4F46E5" : "rgba(44,26,14,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 300ms",
                }}>
                  {i < progressStep ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: "11px", height: "11px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: i === progressStep ? "white" : "#A0856A" }}>{i + 1}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: i < progressStep ? "#4F46E5" : "rgba(44,26,14,0.1)", borderRadius: "99px", transition: "background 300ms" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div style={{ padding: "32px 24px 28px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>👋</div>
            <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "10px" }}>
              Welcome to Vynta{firstName ? `, ${firstName}` : ""}!
            </h1>
            <p style={{ fontSize: "14px", color: "#A0856A", lineHeight: 1.6, marginBottom: "28px" }}>
              Let's get your dashboard set up in 3 quick steps — your business profile, your review tools, and your Smart Inbox. Takes about 2 minutes.
            </p>
            <button type="button" onClick={() => setStep(1)} style={{
              width: "100%", background: "#4F46E5", color: "white",
              borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 700,
              border: "none", cursor: "pointer", marginBottom: "12px",
            }}>
              Let's get started →
            </button>
            <button type="button" onClick={dismiss} style={{
              width: "100%", background: "none", border: "none",
              fontSize: "12px", color: "#A0856A", cursor: "pointer", padding: "4px",
            }}>
              Skip setup, I'll do it later
            </button>
          </div>
        )}

        {/* ── Step 1: Business Profile ── */}
        {step === 1 && (
          <div style={{ padding: "20px 20px 24px" }}>
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", margin: "14px 0 4px" }}>Business Profile</h2>
            <p style={{ fontSize: "12px", color: "#4F46E5", marginBottom: "18px", lineHeight: 1.5 }}>
              This powers Vynta's AI — she'll use your business details to give smarter advice and write better review responses.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={LABEL}>Business Name <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Eddie's Place" style={FIELD} autoFocus />
              </div>
              <div>
                <label style={LABEL}>Business Type</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={{ ...FIELD, cursor: "pointer" }}>
                  <option value="">Select your business type…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>Business Address</label>
                <input type="text" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, Charlotte NC 28211" style={FIELD} />
              </div>
              <div>
                <label style={LABEL}>Website URL</label>
                <input type="url" value={businessUrl} onChange={(e) => setBusinessUrl(e.target.value)}
                  placeholder="https://yourbusiness.com" style={FIELD} />
              </div>
              <div>
                <label style={LABEL}>Phone Number</label>
                <input type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="e.g. (704) 555-0123" style={FIELD} />
              </div>
            </div>
            <button type="button" onClick={saveStep1} disabled={!businessName.trim() || saving}
              style={{
                width: "100%", marginTop: "20px",
                background: !businessName.trim() ? "rgba(79,70,229,0.4)" : "#4F46E5",
                color: "white", borderRadius: "12px", padding: "13px",
                fontSize: "13px", fontWeight: 700, border: "none",
                cursor: !businessName.trim() || saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              {saving ? <><Spinner /> Saving…</> : "Save & Continue →"}
            </button>
          </div>
        )}

        {/* ── Step 2: Review Tools ── */}
        {step === 2 && (
          <div style={{ padding: "20px 20px 24px" }}>
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", margin: "14px 0 4px" }}>Review Tools</h2>
            <p style={{ fontSize: "12px", color: "#4F46E5", marginBottom: "18px", lineHeight: 1.5 }}>
              Set your Google review link so campaigns send customers to the right place, and pick how Vynta sounds when she responds.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={LABEL}>Google Review Link</label>
                <input type="url" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/your-review-link" style={FIELD} autoFocus />
              </div>
              <div>
                <label style={LABEL}>Default Response Tone</label>
                <select value={defaultTone} onChange={(e) => setDefaultTone(e.target.value)} style={{ ...FIELD, cursor: "pointer" }}>
                  {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>Outbound Message Template</label>
                <p style={{ fontSize: "11px", color: "#4F46E5", marginBottom: "6px", lineHeight: 1.5 }}>
                  Sent when you request a review. Use{" "}
                  <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{name}"}</code>{" "}
                  <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{business}"}</code>{" "}
                  <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{link}"}</code>
                </p>
                <textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={3}
                  placeholder={`Hi {name}, thanks for choosing {business}! We'd love a quick Google review: {link}`}
                  style={{ ...FIELD, resize: "none" }} />
              </div>
            </div>
            <button type="button" onClick={saveStep2} disabled={saving}
              style={{
                width: "100%", marginTop: "20px",
                background: "#4F46E5", color: "white",
                borderRadius: "12px", padding: "13px",
                fontSize: "13px", fontWeight: 700, border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              {saving ? <><Spinner /> Saving…</> : "Save & Continue →"}
            </button>
          </div>
        )}

        {/* ── Step 3: Smart Inbox ── */}
        {step === 3 && (
          <div style={{ padding: "20px 20px 24px" }}>
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", margin: "14px 0 4px" }}>Smart Inbox</h2>
            <p style={{ fontSize: "12px", color: "#4F46E5", marginBottom: "18px", lineHeight: 1.5 }}>
              Link your business on Google so Vynta can monitor your review count and pull new reviews automatically.
            </p>

            {inboxDone ? (
              <div style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>✅</div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "4px" }}>Smart Inbox is active</p>
                <p style={{ fontSize: "11px", color: "#A0856A" }}>Your business is verified and linked to Vynta.</p>
              </div>
            ) : lookupResult ? (
              /* Confirm step */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "14px" }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "8px" }}>We found this business</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>{lookupResult.businessName}</p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {lookupResult.starRating !== null && <span style={{ fontSize: "12px", color: "#A0856A" }}>⭐ {lookupResult.starRating.toFixed(1)} stars</span>}
                    {lookupResult.reviewCount !== null && <span style={{ fontSize: "12px", color: "#A0856A" }}>{lookupResult.reviewCount.toLocaleString()} reviews</span>}
                    <span style={{ fontSize: "12px", color: "#A0856A" }}>Zip {inboxZip.trim()}</span>
                  </div>
                </div>
                <div style={{ background: "rgba(196,135,74,0.06)", border: "1px solid rgba(196,135,74,0.2)", borderRadius: "10px", padding: "12px 14px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={verifyChecked} onChange={(e) => setVerifyChecked(e.target.checked)}
                      style={{ marginTop: "2px", accentColor: "#4F46E5", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.6 }}>
                      I confirm I am the owner or authorized manager of this business and have the right to track and respond to its Google reviews.
                    </span>
                  </label>
                </div>
                {inboxError && <p style={{ fontSize: "11px", color: "#DC2626" }}>{inboxError}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" onClick={() => { setLookupResult(null); setVerifyChecked(false); setInboxError(""); }}
                    style={{ flex: 1, background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "10px", padding: "11px", fontSize: "13px", color: "#A0856A", cursor: "pointer" }}>
                    Back
                  </button>
                  <button type="button" onClick={confirmAndActivate} disabled={!verifyChecked || inboxActivating}
                    style={{
                      flex: 2, background: !verifyChecked || inboxActivating ? "rgba(79,70,229,0.4)" : "#4F46E5",
                      color: "white", borderRadius: "10px", padding: "11px",
                      fontSize: "13px", fontWeight: 600, border: "none",
                      cursor: !verifyChecked || inboxActivating ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}>
                    {inboxActivating ? <><Spinner /> Activating…</> : "Confirm & Activate"}
                  </button>
                </div>
              </div>
            ) : (
              /* Lookup form */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="text" value={inboxPlaceId} onChange={(e) => setInboxPlaceId(e.target.value.trim())}
                  placeholder="Google Place ID (e.g. ChIJ…)" style={FIELD} autoFocus />
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "10px", color: "#4F46E5", lineHeight: 1.5 }}
                >
                  How to find your Place ID →
                </a>
                <input type="text" value={inboxName} onChange={(e) => setInboxName(e.target.value)}
                  placeholder="Business name (optional override)" style={FIELD} />
                <input type="text" inputMode="numeric" maxLength={5} value={inboxZip}
                  onChange={(e) => setInboxZip(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Zip code (optional)" style={FIELD} />
                {inboxError && <p style={{ fontSize: "11px", color: "#DC2626" }}>{inboxError}</p>}
                <button type="button" onClick={lookupBusiness}
                  disabled={!inboxPlaceId.trim() || inboxLooking}
                  style={{
                    background: !inboxPlaceId.trim() || inboxLooking ? "rgba(79,70,229,0.4)" : "#4F46E5",
                    color: "white", borderRadius: "10px", padding: "11px",
                    fontSize: "13px", fontWeight: 600, border: "none",
                    cursor: !inboxPlaceId.trim() || inboxLooking ? "not-allowed" : "pointer",
                    opacity: !inboxPlaceId.trim() ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    marginTop: "4px",
                  }}>
                  {inboxLooking ? <><Spinner /> Looking up business…</> : "Look Up Business"}
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              {inboxDone ? (
                <button type="button" onClick={() => setStep(4)}
                  style={{ width: "100%", background: "#4F46E5", color: "white", borderRadius: "12px", padding: "13px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Continue →
                </button>
              ) : (
                <button type="button" onClick={() => setStep(4)}
                  style={{ width: "100%", background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "12px", padding: "13px", fontSize: "13px", color: "#A0856A", cursor: "pointer" }}>
                  Skip for now →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div style={{ padding: "28px 24px 32px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎉</div>
            <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
              You're all set!
            </h2>
            <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.6, marginBottom: "24px" }}>
              Vynta is ready to go. Here's what's been configured for {businessName.trim() || "your business"}:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
              <CheckRow label="Business profile" done={!!businessName.trim()} />
              <CheckRow label="Google Review Link" done={!!googleReviewUrl.trim()} note={!googleReviewUrl.trim() ? "Add it in Settings → Review Tools" : undefined} />
              <CheckRow label="Response tone" done={true} note={TONES.find(t => t.value === defaultTone)?.label} />
              <CheckRow label="Smart Inbox" done={inboxDone} note={!inboxDone ? "Set up anytime in Settings" : undefined} />
            </div>

            <button type="button" onClick={complete} style={{
              width: "100%", background: "#2C1A0E", color: "white",
              borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 700,
              border: "none", cursor: "pointer",
            }}>
              Let's go →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function CheckRow({ label, done, note }: { label: string; done: boolean; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#E8DCC8", borderRadius: "10px", padding: "10px 14px" }}>
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
        background: done ? "#4F46E5" : "rgba(44,26,14,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: "11px", height: "11px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#A0856A" }} />
        )}
      </div>
      <div>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#2C1A0E" }}>{label}</p>
        {note && <p style={{ fontSize: "10px", color: "#A0856A", marginTop: "1px" }}>{note}</p>}
      </div>
    </div>
  );
}
