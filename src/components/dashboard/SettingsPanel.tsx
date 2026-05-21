"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useResponseHistory } from "@/lib/useResponseHistory";
import { getPlan } from "@/lib/plans";

const SMART_INBOX_KEY = "vynta_smart_inbox";

interface SmartInboxConfig {
  businessName: string;
  zipCode: string;
  setupDate: string;
  baselineCount: number;
  lastKnownCount: number;
  lastChecked: string;
  enabled: boolean;
}

interface Props {
  name: string;
  email: string;
  plan: string | null;
  subscriptionStatus: string | null;
  onBack?: () => void;
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

export default function SettingsPanel({ name, email, plan, subscriptionStatus, onBack }: Props) {
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

  // ── Review Tools ──
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [defaultTone, setDefaultTone]         = useState("professional");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [toolsSaved, setToolsSaved]           = useState(false);

  // ── Smart Inbox ──
  const [inboxConfig, setInboxConfig]     = useState<SmartInboxConfig | null>(null);
  const [inboxName, setInboxName]         = useState("");
  const [inboxZip, setInboxZip]           = useState("");
  const [inboxActivating, setInboxActivating] = useState(false);
  const [inboxError, setInboxError]       = useState("");

  // ── Data ──
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    try {
      setBusinessName(localStorage.getItem("vynta_default_business") ?? "");
      setBusinessType(localStorage.getItem("vynta_business_type") ?? "");
      setBusinessAddress(localStorage.getItem("vynta_business_address") ?? "");
      setBusinessUrl(localStorage.getItem("vynta_business_url") ?? "");
      setBusinessPhone(localStorage.getItem("vynta_business_phone") ?? "");
      setGoogleReviewUrl(localStorage.getItem("vynta_google_review_url") ?? "");
      setDefaultTone(localStorage.getItem("vynta_default_tone") ?? "professional");
      setMessageTemplate(localStorage.getItem("vynta_message_template") ?? "");
      const inbox = localStorage.getItem(SMART_INBOX_KEY);
      if (inbox) setInboxConfig(JSON.parse(inbox) as SmartInboxConfig);
    } catch {}
  }, []);

  function saveBusinessProfile() {
    try {
      localStorage.setItem("vynta_default_business", businessName.trim());
      localStorage.setItem("vynta_business_type", businessType);
      localStorage.setItem("vynta_business_address", businessAddress.trim());
      localStorage.setItem("vynta_business_url", businessUrl.trim());
      localStorage.setItem("vynta_business_phone", businessPhone.trim());
    } catch {}
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 2000);
  }

  function saveReviewTools() {
    try {
      localStorage.setItem("vynta_google_review_url", googleReviewUrl.trim());
      localStorage.setItem("vynta_default_tone", defaultTone);
      localStorage.setItem("vynta_message_template", messageTemplate.trim());
    } catch {}
    setToolsSaved(true);
    setTimeout(() => setToolsSaved(false), 2000);
  }

  async function activateSmartInbox() {
    if (!inboxName.trim() || !inboxZip.trim() || inboxActivating) return;
    setInboxActivating(true);
    setInboxError("");
    try {
      const res = await fetch("/api/lookup-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: inboxName.trim(), zipCode: inboxZip.trim() }),
      });
      const data = await res.json() as { reviewCount?: number | null; starRating?: number | null; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Couldn't find that business.");
      const count = data.reviewCount ?? 0;

      // Populate home page stats with real Serper data
      try {
        localStorage.setItem("vynta_stats", JSON.stringify({
          totalReviews: count,
          avgRating: data.starRating ?? null,
        }));
      } catch {}

      const config: SmartInboxConfig = {
        businessName: inboxName.trim(),
        zipCode: inboxZip.trim(),
        setupDate: new Date().toISOString(),
        baselineCount: count,
        lastKnownCount: count,
        lastChecked: new Date().toISOString(),
        enabled: true,
      };
      localStorage.setItem(SMART_INBOX_KEY, JSON.stringify(config));
      setInboxConfig(config);
    } catch (err) {
      setInboxError(err instanceof Error ? err.message : "Activation failed. Check the business name and zip.");
    } finally {
      setInboxActivating(false);
    }
  }

  function deactivateSmartInbox() {
    try { localStorage.removeItem(SMART_INBOX_KEY); } catch {}
    setInboxConfig(null);
    setInboxName("");
    setInboxZip("");
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
            <a href="/#pricing" style={{ fontSize: "13px", fontWeight: 600, color: "#2D9B8A" }}>View plans →</a>
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
            <SaveButton onSave={saveBusinessProfile} saved={bizSaved} />
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
            <p style={{ fontSize: "11px", color: "#A0856A", marginBottom: "8px", lineHeight: 1.5 }}>
              Paste your Google review URL so campaigns send customers to the right place. Find it in Google Business Profile → Get more reviews.
            </p>
            <input type="url" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://g.page/r/your-review-link" style={FIELD} />
          </div>

          <div>
            <label style={LABEL}>Default Response Tone</label>
            <p style={{ fontSize: "11px", color: "#A0856A", marginBottom: "8px" }}>Pre-selects your preferred AI reply personality on the Home tab.</p>
            <select value={defaultTone} onChange={(e) => setDefaultTone(e.target.value)}
              style={{ ...FIELD, cursor: "pointer" }}>
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label style={LABEL}>Outbound Message Template</label>
            <p style={{ fontSize: "11px", color: "#A0856A", marginBottom: "8px", lineHeight: 1.5 }}>
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
            <SaveButton onSave={saveReviewTools} saved={toolsSaved} />
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
          <p style={{ fontSize: "12px", color: "#A0856A", lineHeight: 1.5 }}>
            Monitors your Google review count automatically. New reviews land in your Reviews → New tab.
          </p>
        </div>

        {inboxConfig?.enabled ? (
          <div>
            <div style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "12px 14px", margin: "12px 0" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "2px" }}>{inboxConfig.businessName}</p>
              <p style={{ fontSize: "11px", color: "#A0856A" }}>
                Zip {inboxConfig.zipCode} · Started {new Date(inboxConfig.setupDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {inboxConfig.baselineCount.toLocaleString()} reviews at setup
              </p>
            </div>
            <p style={{ fontSize: "11px", color: "#A0856A", marginBottom: "12px" }}>
              Last synced: {new Date(inboxConfig.lastChecked).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
            <button type="button" onClick={deactivateSmartInbox}
              style={{ background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 600, color: "#A0856A", cursor: "pointer" }}>
              Deactivate Smart Inbox
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="text" value={inboxName} onChange={(e) => setInboxName(e.target.value)}
              placeholder="Business name to monitor" style={FIELD} />
            <input type="text" inputMode="numeric" maxLength={5} value={inboxZip}
              onChange={(e) => setInboxZip(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Zip code" style={FIELD} />
            {inboxError && <p style={{ fontSize: "11px", color: "#DC2626" }}>{inboxError}</p>}
            <button type="button" onClick={activateSmartInbox}
              disabled={!inboxName.trim() || !inboxZip.trim() || inboxActivating}
              style={{
                background: inboxActivating ? "rgba(79,70,229,0.5)" : "#4F46E5",
                color: "white", borderRadius: "10px", padding: "11px",
                fontSize: "13px", fontWeight: 600, border: "none",
                cursor: (!inboxName.trim() || !inboxZip.trim() || inboxActivating) ? "not-allowed" : "pointer",
                opacity: (!inboxName.trim() || !inboxZip.trim()) ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              {inboxActivating ? (
                <>
                  <svg style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                  </svg>
                  Looking up business…
                </>
              ) : "Activate Smart Inbox"}
            </button>
            <p style={{ fontSize: "10px", color: "#A0856A", lineHeight: 1.5 }}>
              Activating will pull the current review count as your baseline. Any new reviews after this point will appear in your inbox.
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

      {/* Sign out */}
      <button type="button" onClick={handleSignOut}
        style={{ width: "100%", background: "transparent", border: "1.5px solid #FCA5A5", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 600, color: "#EF4444", cursor: "pointer", marginBottom: "120px" }}>
        Sign out
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
