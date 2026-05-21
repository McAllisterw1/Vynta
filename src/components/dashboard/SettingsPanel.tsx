"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useResponseHistory } from "@/lib/useResponseHistory";
import { getPlan } from "@/lib/plans";

const DEFAULT_BUSINESS_KEY = "vynta_default_business";
const MESSAGE_TEMPLATE_KEY = "vynta_message_template";
const GOOGLE_REVIEW_URL_KEY = "vynta_google_review_url";
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

const DIVIDER: React.CSSProperties = {
  height: "1px",
  background: "rgba(44,26,14,0.06)",
  margin: "0 -20px",
};

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  starter: { bg: "#E8DCC8", text: "#A0856A" },
  growth:  { bg: "#E8F5F2", text: "#2D9B8A" },
  agency:  { bg: "#F5EDE0", text: "#C4874A" },
};

export default function SettingsPanel({ name, email, plan, subscriptionStatus, onBack }: Props) {
  const { signOut } = useClerk();
  const router = useRouter();
  const { history, clearHistory } = useResponseHistory();

  const [defaultBusiness, setDefaultBusiness] = useState("");
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [googleUrlSaved, setGoogleUrlSaved] = useState(false);

  // Smart Inbox
  const [inboxConfig, setInboxConfig] = useState<SmartInboxConfig | null>(null);
  const [inboxName, setInboxName] = useState("");
  const [inboxZip, setInboxZip] = useState("");
  const [inboxActivating, setInboxActivating] = useState(false);
  const [inboxError, setInboxError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_BUSINESS_KEY);
      if (stored) setDefaultBusiness(stored);
      const tpl = localStorage.getItem(MESSAGE_TEMPLATE_KEY);
      if (tpl) setMessageTemplate(tpl);
      const gUrl = localStorage.getItem(GOOGLE_REVIEW_URL_KEY);
      if (gUrl) setGoogleReviewUrl(gUrl);
      const inbox = localStorage.getItem(SMART_INBOX_KEY);
      if (inbox) setInboxConfig(JSON.parse(inbox) as SmartInboxConfig);
    } catch {}
  }, []);

  function handleSaveBusiness() {
    try { localStorage.setItem(DEFAULT_BUSINESS_KEY, defaultBusiness.trim()); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSaveTemplate() {
    try { localStorage.setItem(MESSAGE_TEMPLATE_KEY, messageTemplate.trim()); } catch {}
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2000);
  }

  function handleSaveGoogleUrl() {
    try { localStorage.setItem(GOOGLE_REVIEW_URL_KEY, googleReviewUrl.trim()); } catch {}
    setGoogleUrlSaved(true);
    setTimeout(() => setGoogleUrlSaved(false), 2000);
  }

  function handleClearHistory() {
    clearHistory();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
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
      const data = await res.json() as { reviewCount?: number | null; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Couldn't find that business.");
      const count = data.reviewCount ?? 0;
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

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const planData = getPlan(plan);
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const planColors = plan ? (PLAN_COLORS[plan] ?? PLAN_COLORS.starter) : PLAN_COLORS.starter;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "28px 24px 0" }}>

      <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "20px" }}>Settings</h1>

      {/* Upgrade card — hidden for Agency */}
      {plan !== "agency" && (
        <div style={{
          borderRadius: "16px",
          border: "1.5px solid #C4874A",
          padding: "16px 20px",
          marginBottom: "12px",
          background: "rgba(196,135,74,0.06)",
        }}>
          <p className="font-display" style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
            {plan ? `You're on the ${planData?.name ?? plan} plan` : "No active plan"}
          </p>
          <p style={{ fontSize: "12px", color: "#A0856A", marginBottom: "12px" }}>
            Unlock more features by upgrading
          </p>
          <a
            href="/#pricing"
            style={{
              display: "inline-block",
              background: "#2D9B8A",
              color: "white",
              borderRadius: "10px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Upgrade Options
          </a>
        </div>
      )}

      {/* Combined Profile + Subscription */}
      <div style={{ ...CARD, padding: "20px", marginBottom: "12px", flexShrink: 0 }}>
        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "14px", fontWeight: 600 }}>Account</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px" }}>
          <span style={{ fontSize: "13px", color: "#A0856A" }}>Name</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#2C1A0E" }}>{name || "—"}</span>
        </div>
        <div style={DIVIDER} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
          <span style={{ fontSize: "13px", color: "#A0856A" }}>Email</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#2C1A0E", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{email || "—"}</span>
        </div>
        <div style={DIVIDER} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px" }}>
          <span style={{ fontSize: "13px", color: "#A0856A" }}>Plan</span>
          {planData && isActive ? (
            <span style={{ background: planColors.bg, color: planColors.text, borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {planData.name}
            </span>
          ) : (
            <a href="/#pricing" style={{ fontSize: "13px", fontWeight: 600, color: "#2D9B8A" }}>View plans →</a>
          )}
        </div>
      </div>

      {/* Default Business Name */}
      <div style={{ ...CARD, padding: "20px", marginBottom: "12px", flexShrink: 0 }}>
        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "12px", fontWeight: 600 }}>Default Business Name</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={defaultBusiness}
            onChange={(e) => setDefaultBusiness(e.target.value)}
            placeholder="e.g. Marcus's Barbershop"
            style={{ flex: 1, background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "12px 16px", fontSize: "14px", color: "#2C1A0E", outline: "none" }}
            className="focus:ring-2 focus:ring-[#C4874A]/30"
          />
          <button
            type="button"
            onClick={handleSaveBusiness}
            disabled={!defaultBusiness.trim()}
            style={{ background: "#2D9B8A", color: "white", borderRadius: "10px", padding: "12px 20px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0, opacity: !defaultBusiness.trim() ? 0.5 : 1 }}
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Response History */}
      <div style={{ ...CARD, padding: "16px 20px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600 }}>Response History</p>
          <p style={{ fontSize: "13px", color: "#2C1A0E", marginTop: "4px" }}>
            {history.length > 0 ? `${history.length} saved response${history.length !== 1 ? "s" : ""}` : "No saved responses"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearHistory}
          disabled={history.length === 0}
          style={{ background: "#E8DCC8", color: "#A0856A", borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", cursor: "pointer", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          {cleared ? "Cleared!" : "Clear"}
        </button>
      </div>

      {/* Default Message Template */}
      <div style={{ ...CARD, padding: "20px", marginBottom: "12px" }}>
        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "12px", fontWeight: 600 }}>
          Default Message Template
        </p>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          rows={4}
          placeholder={"Hi {name}, thanks for choosing {business}! We'd love it if you left us a quick Google review: {link}"}
          style={{
            width: "100%",
            background: "white",
            borderRadius: "10px",
            border: "none",
            boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#2C1A0E",
            outline: "none",
            resize: "none",
            lineHeight: 1.6,
            boxSizing: "border-box",
            display: "block",
            marginBottom: "10px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <p style={{ fontSize: "11px", color: "#A0856A", lineHeight: 1.5, flex: 1 }}>
            Available placeholders: <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{name}"}</code>{" "}
            <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{business}"}</code>{" "}
            <code style={{ fontFamily: "monospace", background: "rgba(44,26,14,0.06)", borderRadius: "4px", padding: "1px 5px" }}>{"{link}"}</code>
          </p>
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={!messageTemplate.trim()}
            style={{
              background: "#2D9B8A",
              color: "white",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: messageTemplate.trim() ? "pointer" : "not-allowed",
              flexShrink: 0,
              opacity: messageTemplate.trim() ? 1 : 0.5,
            }}
          >
            {templateSaved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Google Review Link */}
      <div style={{ ...CARD, padding: "20px", marginBottom: "12px" }}>
        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "4px", fontWeight: 600 }}>
          Google Review Link
        </p>
        <p style={{ fontSize: "12px", color: "#A0856A", marginBottom: "12px" }}>
          Paste your Google review URL so customers are sent to the right place.
        </p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
          <input
            type="url"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder="https://g.page/r/your-review-link"
            style={{ flex: 1, background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "12px 16px", fontSize: "14px", color: "#2C1A0E", outline: "none" }}
          />
          <button
            type="button"
            onClick={handleSaveGoogleUrl}
            disabled={!googleReviewUrl.trim()}
            style={{ background: googleUrlSaved ? "#2D9B8A" : "#2D9B8A", color: "white", borderRadius: "10px", padding: "12px 20px", fontSize: "13px", fontWeight: 600, border: "none", cursor: googleReviewUrl.trim() ? "pointer" : "not-allowed", flexShrink: 0, opacity: googleReviewUrl.trim() ? 1 : 0.5 }}
          >
            {googleUrlSaved ? "Saved!" : "Save"}
          </button>
        </div>
        <p style={{ fontSize: "11px", color: "#A0856A", lineHeight: 1.5 }}>
          To find this: Google Business Profile → Get more reviews → copy the link.
        </p>
      </div>

      {/* Smart Inbox */}
      <div style={{ ...CARD, padding: "20px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#4F46E5", fontWeight: 700 }}>
            Smart Inbox
          </p>
          {inboxConfig?.enabled && (
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4F46E5", display: "inline-block", flexShrink: 0 }} />
          )}
        </div>
        <p style={{ fontSize: "12px", color: "#A0856A", marginBottom: "14px", lineHeight: 1.5 }}>
          Monitors your Google reviews automatically. New reviews land directly in your New tab.
        </p>

        {inboxConfig?.enabled ? (
          /* ── Active state ── */
          <div>
            <div style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "2px" }}>
                {inboxConfig.businessName}
              </p>
              <p style={{ fontSize: "11px", color: "#A0856A" }}>
                Zip {inboxConfig.zipCode} · Started {new Date(inboxConfig.setupDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {inboxConfig.baselineCount} reviews at setup
              </p>
            </div>
            <p style={{ fontSize: "11px", color: "#A0856A", marginBottom: "12px" }}>
              Last synced: {new Date(inboxConfig.lastChecked).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
            <button
              type="button"
              onClick={deactivateSmartInbox}
              style={{ background: "none", border: "1px solid rgba(44,26,14,0.15)", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 600, color: "#A0856A", cursor: "pointer" }}
            >
              Deactivate Smart Inbox
            </button>
          </div>
        ) : (
          /* ── Setup state ── */
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
              <input
                type="text"
                value={inboxName}
                onChange={(e) => setInboxName(e.target.value)}
                placeholder="Business name (e.g. Apex Plumbing)"
                style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "11px 14px", fontSize: "13px", color: "#2C1A0E", outline: "none", width: "100%", boxSizing: "border-box" as const }}
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={inboxZip}
                onChange={(e) => setInboxZip(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Zip code"
                style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "11px 14px", fontSize: "13px", color: "#2C1A0E", outline: "none", width: "100%", boxSizing: "border-box" as const }}
              />
            </div>
            {inboxError && (
              <p style={{ fontSize: "11px", color: "#DC2626", marginBottom: "8px" }}>{inboxError}</p>
            )}
            <button
              type="button"
              onClick={activateSmartInbox}
              disabled={!inboxName.trim() || !inboxZip.trim() || inboxActivating}
              style={{
                width: "100%",
                background: inboxActivating ? "rgba(79,70,229,0.5)" : "#4F46E5",
                color: "white",
                borderRadius: "10px",
                padding: "11px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: (!inboxName.trim() || !inboxZip.trim() || inboxActivating) ? "not-allowed" : "pointer",
                opacity: (!inboxName.trim() || !inboxZip.trim()) ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "opacity 150ms",
              }}
            >
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
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        style={{ width: "100%", background: "transparent", border: "1.5px solid #FCA5A5", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 600, color: "#EF4444", cursor: "pointer", marginTop: "8px", marginBottom: "120px" }}
      >
        Sign out
      </button>
    </div>
  );
}
