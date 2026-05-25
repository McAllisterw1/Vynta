"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useResponseHistory } from "@/lib/useResponseHistory";
import { getPlan } from "@/lib/plans";

interface SmartInboxConfig {
  businessName: string;
  zipCode: string;
  placeId?: string;
  setupDate: string;
  baselineCount: number;
  lastKnownCount: number;
  lastChecked: string;
  enabled: boolean;
  verified: boolean;
}

interface LookupResult {
  businessName: string;
  reviewCount: number | null;
  starRating: number | null;
}

interface Props {
  name: string;
  email: string;
  plan: string | null;
  subscriptionStatus: string | null;
  onBack?: () => void;
  onOpenWizard?: () => void;
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

const LABEL: React.CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#A0856A",
  fontWeight: 600,
  display: "block",
  marginBottom: "6px",
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "#2C1A0E",
  fontWeight: 700,
  marginBottom: "10px",
};

const DIVIDER: React.CSSProperties = {
  height: "1px",
  background: "rgba(44,26,14,0.06)",
};

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

function SaveButton({ onSave, saving, saved, disabled }: { onSave: () => void; saving?: boolean; saved: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled || saving}
      style={{
        background: saved ? "#2D9B8A" : "#2C1A0E",
        color: "white",
        borderRadius: "10px",
        padding: "10px 20px",
        fontSize: "13px",
        fontWeight: 600,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
        transition: "background 200ms",
        whiteSpace: "nowrap",
      }}
    >
      {saved ? "Saved ✓" : "Save"}
    </button>
  );
}

export default function SettingsPanel({ name, email, plan, subscriptionStatus, onBack, onOpenWizard }: Props) {
  const { signOut } = useClerk();
  const router = useRouter();
  const { history, clearHistory } = useResponseHistory();
  const planData = getPlan(plan);
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  // ── Business Profile ──
  const [businessName, setBusinessName]     = useState("");
  const [businessType, setBusinessType]     = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessUrl, setBusinessUrl]       = useState("");
  const [businessPhone, setBusinessPhone]   = useState("");
  const [bizSaved, setBizSaved]             = useState(false);
  const [bizSaving, setBizSaving]           = useState(false);

  // ── Review Tools ──
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [defaultTone, setDefaultTone]         = useState("professional");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [toolsSaved, setToolsSaved]           = useState(false);
  const [toolsSaving, setToolsSaving]         = useState(false);

  // ── Smart Inbox ──
  const [inboxConfig, setInboxConfig]       = useState<SmartInboxConfig | null>(null);
  const [inboxName, setInboxName]           = useState("");
  const [inboxZip, setInboxZip]             = useState("");
  const [inboxPlaceId, setInboxPlaceId]     = useState("");
  const [inboxLooking, setInboxLooking]     = useState(false);
  const [inboxActivating, setInboxActivating] = useState(false);
  const [inboxError, setInboxError]         = useState("");
  const [lookupResult, setLookupResult]     = useState<LookupResult | null>(null);
  const [verifyChecked, setVerifyChecked]   = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState(false);
  const [placeIdDraft, setPlaceIdDraft]     = useState("");
  const [placeIdSaving, setPlaceIdSaving]   = useState(false);

  // ── Data ──
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Load settings from API
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((data: {
        businessName?: string; businessType?: string; businessAddress?: string;
        businessUrl?: string; businessPhone?: string; googleReviewUrl?: string;
        defaultTone?: string; messageTemplate?: string;
      }) => {
        if (data.businessName)    setBusinessName(data.businessName);
        if (data.businessType)    setBusinessType(data.businessType);
        if (data.businessAddress) setBusinessAddress(data.businessAddress);
        if (data.businessUrl)     setBusinessUrl(data.businessUrl);
        if (data.businessPhone)   setBusinessPhone(data.businessPhone);
        if (data.googleReviewUrl) setGoogleReviewUrl(data.googleReviewUrl);
        if (data.defaultTone)     setDefaultTone(data.defaultTone);
        if (data.messageTemplate) setMessageTemplate(data.messageTemplate);
      })
      .catch(() => {});

    // Load smart inbox from API
    fetch("/api/user/smart-inbox")
      .then((r) => r.json())
      .then((data: {
        enabled?: boolean; businessName?: string; zipCode?: string; placeId?: string;
        setupDate?: string; baselineCount?: number; lastKnownCount?: number; lastChecked?: string;
        verified?: boolean;
      } | null) => {
        if (data?.enabled) {
          const config = {
            businessName: data.businessName ?? "",
            zipCode: data.zipCode ?? "",
            placeId: data.placeId ?? undefined,
            setupDate: data.setupDate ?? new Date().toISOString(),
            baselineCount: data.baselineCount ?? 0,
            lastKnownCount: data.lastKnownCount ?? 0,
            lastChecked: data.lastChecked ?? new Date().toISOString(),
            enabled: true,
            verified: data.verified ?? false,
          };
          setInboxConfig(config);
          try { localStorage.setItem("vynta_smart_inbox_config", JSON.stringify(config)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  async function saveBusinessProfile() {
    setBizSaving(true);
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
    setBizSaving(false);
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 2000);
  }

  async function saveReviewTools() {
    setToolsSaving(true);
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
    setToolsSaving(false);
    setToolsSaved(true);
    setTimeout(() => setToolsSaved(false), 2000);
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
      const res = await fetch("/api/user/smart-inbox", {
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Activation failed. Please try again.");
      }
      const newConfig = {
        businessName: lookupResult.businessName,
        zipCode: inboxZip.trim() || "",
        placeId: inboxPlaceId.trim() || undefined,
        setupDate: now,
        baselineCount: count,
        lastKnownCount: count,
        lastChecked: now,
        enabled: true,
        verified: true,
      };
      setInboxConfig(newConfig);
      try { localStorage.setItem("vynta_smart_inbox_config", JSON.stringify(newConfig)); } catch {}
      setLookupResult(null);
      setVerifyChecked(false);
    } catch (err) {
      setInboxError(err instanceof Error ? err.message : "Activation failed. Please try again.");
    } finally {
      setInboxActivating(false);
    }
  }

  async function deactivateSmartInbox() {
    try {
      await fetch("/api/user/smart-inbox", { method: "DELETE" });
    } catch {}
    try { localStorage.removeItem("vynta_smart_inbox_config"); } catch {}
    setInboxConfig(null);
    setInboxName("");
    setInboxZip("");
    setLookupResult(null);
    setVerifyChecked(false);
  }

  async function saveSmartInboxPlaceId() {
    setPlaceIdSaving(true);
    try {
      const res = await fetch("/api/user/smart-inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: placeIdDraft.trim() || null }),
      });
      const data = await res.json() as { placeId?: string | null };
      setInboxConfig((prev) => prev ? { ...prev, placeId: data.placeId ?? undefined } : prev);
      setEditingPlaceId(false);
    } catch {}
    setPlaceIdSaving(false);
  }

  function handleClearHistory() {
    clearHistory();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px 24px 0" }}>

      <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "20px" }}>Settings</h1>

      {/* ── Upgrade banner ── */}
      {plan !== "agency" && (
        <div style={{ borderRadius: "14px", border: "1.5px solid #C4874A", padding: "14px 18px", marginBottom: "20px", background: "rgba(196,135,74,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p className="font-display" style={{ fontSize: "13px", fontWeight: 700, color: "#2C1A0E" }}>
              {plan ? `You're on the ${planData?.name ?? plan} plan` : "No active plan"}
            </p>
            <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>Unlock more features by upgrading</p>
          </div>
          <a href="/#pricing" style={{ background: "#2D9B8A", color: "white", borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
            Upgrade
          </a>
        </div>
      )}

      {/* ════════════════════════════════════
          SECTION 1 — Account
      ════════════════════════════════════ */}
      <p style={SECTION_TITLE}>Account</p>
      <div style={{ ...CARD, padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px" }}>
          <span style={{ fontSize: "12px", color: "#A0856A" }}>Name</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E" }}>{name || "—"}</span>
        </div>
        <div style={DIVIDER} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
          <span style={{ fontSize: "12px", color: "#A0856A" }}>Email</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#2C1A0E", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{email || "—"}</span>
        </div>
        <div style={DIVIDER} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px" }}>
          <span style={{ fontSize: "12px", color: "#A0856A" }}>Plan</span>
          {planData && isActive ? (
            <span style={{ background: "#E8DCC8", color: "#C4874A", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {planData.name}
            </span>
          ) : (
            <a href="/#pricing" style={{ fontSize: "13px", fontWeight: 600, color: "#4F46E5" }}>View plans →</a>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          SECTION 2 — Business Profile
      ════════════════════════════════════ */}
      <p style={SECTION_TITLE}>Business Profile</p>
      <div style={{ ...CARD, padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          <div>
            <label style={LABEL}>Business Name</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Eddie's Place" style={FIELD} />
          </div>

          <div>
            <label style={LABEL}>Business Type</label>
            <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
              style={{ ...FIELD, cursor: "pointer" }}>
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

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SaveButton onSave={saveBusinessProfile} saving={bizSaving} saved={bizSaved} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          SECTION 3 — Review Tools
      ════════════════════════════════════ */}
      <p style={SECTION_TITLE}>Review Tools</p>
      <div style={{ ...CARD, padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          <div>
            <label style={LABEL}>Google Review Link</label>
            <p style={{ fontSize: "11px", color: "#4F46E5", marginBottom: "8px", lineHeight: 1.5 }}>
              Paste your Google review URL so campaigns send customers to the right place. Find it in Google Business Profile → Get more reviews.
            </p>
            <input type="url" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://g.page/r/your-review-link" style={FIELD} />
          </div>

          <div>
            <label style={LABEL}>Default Response Tone</label>
            <p style={{ fontSize: "11px", color: "#4F46E5", marginBottom: "8px" }}>Pre-selects your preferred AI reply personality on the Home tab.</p>
            <select value={defaultTone} onChange={(e) => setDefaultTone(e.target.value)}
              style={{ ...FIELD, cursor: "pointer" }}>
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label style={LABEL}>Outbound Message Template</label>
            <p style={{ fontSize: "11px", color: "#4F46E5", marginBottom: "8px", lineHeight: 1.5 }}>
              Default SMS/email sent when you request a review. Use{" "}
              <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{name}"}</code>{" "}
              <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{business}"}</code>{" "}
              <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{link}"}</code>
            </p>
            <textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)}
              rows={3}
              placeholder="Hi {name}, thanks for choosing {business}! We'd love a quick Google review: {link}"
              style={{ ...FIELD, resize: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SaveButton onSave={saveReviewTools} saving={toolsSaving} saved={toolsSaved} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          SECTION 4 — Smart Inbox
      ════════════════════════════════════ */}
      <p style={SECTION_TITLE}>Smart Inbox</p>
      <div style={{ ...CARD, padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          {inboxConfig?.enabled && (
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4F46E5", display: "inline-block" }} />
          )}
          <p style={{ fontSize: "12px", color: "#4F46E5", lineHeight: 1.5 }}>
            Monitors your Google review count automatically. New reviews land in your Reviews → New tab.
          </p>
        </div>

        {inboxConfig?.enabled ? (
          <div>
            <div style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "12px 14px", margin: "12px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E" }}>{inboxConfig.businessName}</p>
                {inboxConfig.verified && (
                  <span style={{ background: "rgba(79,70,229,0.12)", color: "#4F46E5", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0 }}>
                    VERIFIED ✓
                  </span>
                )}
              </div>
              <p style={{ fontSize: "11px", color: "#A0856A" }}>
                Zip {inboxConfig.zipCode} · Started {new Date(inboxConfig.setupDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {inboxConfig.baselineCount.toLocaleString()} reviews at setup
              </p>
            </div>
            <p style={{ fontSize: "11px", color: "#A0856A", marginBottom: "12px" }}>
              Last synced: {new Date(inboxConfig.lastChecked).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>

            {/* Place ID editor */}
            <div style={{ borderTop: "1px solid rgba(44,26,14,0.06)", paddingTop: "12px", marginBottom: "12px" }}>
              <p style={LABEL}>Google Place ID</p>
              {editingPlaceId ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <input
                    type="text"
                    value={placeIdDraft}
                    onChange={(e) => setPlaceIdDraft(e.target.value.trim())}
                    placeholder="ChIJ…"
                    style={FIELD}
                    autoFocus
                  />
                  <a
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "10px", color: "#4F46E5", lineHeight: 1.5 }}
                  >
                    Find your Place ID →
                  </a>
                  <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                    <button type="button" onClick={() => setEditingPlaceId(false)}
                      style={{ background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", color: "#A0856A", cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button type="button" onClick={saveSmartInboxPlaceId} disabled={placeIdSaving}
                      style={{ background: "#2C1A0E", color: "white", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, border: "none", cursor: placeIdSaving ? "not-allowed" : "pointer", opacity: placeIdSaving ? 0.6 : 1 }}>
                      {placeIdSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: inboxConfig.placeId ? "#2C1A0E" : "#A0856A", fontFamily: inboxConfig.placeId ? "monospace" : "inherit", wordBreak: "break-all" }}>
                    {inboxConfig.placeId ?? "Not set"}
                  </span>
                  <button type="button" onClick={() => { setPlaceIdDraft(inboxConfig.placeId ?? ""); setEditingPlaceId(true); }}
                    style={{ background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "8px", padding: "5px 12px", fontSize: "11px", color: "#A0856A", cursor: "pointer", flexShrink: 0 }}>
                    {inboxConfig.placeId ? "Edit" : "Add"}
                  </button>
                </div>
              )}
            </div>

            <button type="button" onClick={deactivateSmartInbox}
              style={{ background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 600, color: "#A0856A", cursor: "pointer" }}>
              Deactivate Smart Inbox
            </button>
          </div>
        ) : lookupResult ? (
          /* ── Step 2: Confirm found business ── */
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "14px" }}>
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "8px" }}>We found this business</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>{lookupResult.businessName}</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {lookupResult.starRating !== null && (
                  <span style={{ fontSize: "12px", color: "#A0856A" }}>⭐ {lookupResult.starRating.toFixed(1)} stars</span>
                )}
                {lookupResult.reviewCount !== null && (
                  <span style={{ fontSize: "12px", color: "#A0856A" }}>{lookupResult.reviewCount.toLocaleString()} reviews</span>
                )}
                <span style={{ fontSize: "12px", color: "#A0856A" }}>Zip {inboxZip.trim()}</span>
              </div>
            </div>

            <div style={{ background: "rgba(196,135,74,0.06)", border: "1px solid rgba(196,135,74,0.2)", borderRadius: "10px", padding: "12px 14px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={verifyChecked}
                  onChange={(e) => setVerifyChecked(e.target.checked)}
                  style={{ marginTop: "2px", accentColor: "#4F46E5", flexShrink: 0 }}
                />
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
              <button type="button" onClick={confirmAndActivate}
                disabled={!verifyChecked || inboxActivating}
                style={{
                  flex: 2,
                  background: !verifyChecked || inboxActivating ? "rgba(79,70,229,0.4)" : "#4F46E5",
                  color: "white", borderRadius: "10px", padding: "11px",
                  fontSize: "13px", fontWeight: 600, border: "none",
                  cursor: !verifyChecked || inboxActivating ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}>
                {inboxActivating ? (
                  <>
                    <svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                    </svg>
                    Activating…
                  </>
                ) : "Confirm & Activate"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Step 1: Enter business details ── */
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="text" value={inboxPlaceId} onChange={(e) => setInboxPlaceId(e.target.value.trim())}
              placeholder="Google Place ID (e.g. ChIJ…)" style={FIELD} />
            <a
              href="https://developers.google.com/maps/documentation/places/web-service/place-id"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "10px", color: "#4F46E5", lineHeight: 1.5, marginTop: "-4px" }}
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
                background: inboxLooking ? "rgba(79,70,229,0.5)" : "#4F46E5",
                color: "white", borderRadius: "10px", padding: "11px",
                fontSize: "13px", fontWeight: 600, border: "none",
                cursor: (!inboxPlaceId.trim() || inboxLooking) ? "not-allowed" : "pointer",
                opacity: !inboxPlaceId.trim() ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              {inboxLooking ? (
                <>
                  <svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                  </svg>
                  Looking up business…
                </>
              ) : "Look Up Business"}
            </button>
            <p style={{ fontSize: "10px", color: "#A0856A", lineHeight: 1.5 }}>
              Outscraper pulls exact review counts and text directly from Google using your Place ID.
            </p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════
          SECTION 5 — Data & History
      ════════════════════════════════════ */}
      <p style={SECTION_TITLE}>Data & History</p>
      <div style={{ ...CARD, padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E" }}>AI Response History</p>
          <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>
            {history.length > 0 ? `${history.length} response${history.length !== 1 ? "s" : ""} saved` : "No responses yet"}
          </p>
        </div>
        <button type="button" onClick={handleClearHistory} disabled={history.length === 0}
          style={{ background: "#E8DCC8", color: "#A0856A", borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", cursor: "pointer", opacity: history.length === 0 ? 0.4 : 1 }}>
          {cleared ? "Cleared!" : "Clear"}
        </button>
      </div>

      {/* Restart setup wizard */}
      {onOpenWizard && (
        <button type="button" onClick={onOpenWizard}
          style={{ width: "100%", background: "transparent", border: "1.5px solid rgba(79,70,229,0.3)", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 600, color: "#4F46E5", cursor: "pointer", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "16px", height: "16px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Restart Setup Wizard
        </button>
      )}

      {/* Sign out */}
      <button type="button" onClick={handleSignOut}
        style={{ width: "100%", background: "transparent", border: "1.5px solid #FCA5A5", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 600, color: "#EF4444", cursor: "pointer", marginBottom: "120px" }}>
        Sign out
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
