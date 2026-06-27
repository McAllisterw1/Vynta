"use client";

import { useState, useEffect } from "react";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";

const FALLBACK_TEMPLATE =
  "Hi {name}, thanks for choosing {business}! We'd love it if you left us a quick Google review: {link}";

const CARD: React.CSSProperties = {
  background: "#120804",
  borderRadius: "16px",
  border: "1px solid rgba(45,155,138,0.12)",
};

const FIELD: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  borderRadius: "10px",
  border: "1px solid rgba(45,155,138,0.2)",
  padding: "11px 14px",
  fontSize: "14px",
  color: "rgba(255,255,255,0.9)",
  width: "100%",
  outline: "none",
  colorScheme: "dark" as const,
};

const LABEL: React.CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#A0856A",
  display: "block",
  marginBottom: "6px",
  fontWeight: 600,
};

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  channel: "email" | "sms" | "both";
}

interface Campaign {
  id: string;
  createdAt: string;
  businessName: string;
  contacts: Contact[];
  messageTemplate: string;
}

function newContact(): Contact {
  return { id: crypto.randomUUID(), name: "", email: "", phone: "", channel: "email" };
}

function channelsUsed(campaign: Campaign): string {
  const set = new Set(campaign.contacts.map((c) => c.channel));
  return Array.from(set)
    .map((c) => (c === "both" ? "Email & SMS" : c === "email" ? "Email" : "SMS"))
    .join(", ");
}


export default function RequestCampaign({ onBack, plan, onNavigate }: { onBack?: () => void; plan?: string | null; onNavigate?: (tab: number) => void } = {}) {
  const [tab, setTab] = useState<"send" | "history">("send");
  const [businessName, setBusinessName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([newContact()]);
  const [template, setTemplate] = useState(FALLBACK_TEMPLATE);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");

  useEffect(() => {
    // Load settings from API
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((data: { businessName?: string; messageTemplate?: string; googleReviewUrl?: string }) => {
        if (data.businessName) setBusinessName(data.businessName);
        if (data.messageTemplate) setTemplate(data.messageTemplate);
        if (data.googleReviewUrl) setGoogleReviewUrl(data.googleReviewUrl);
      })
      .catch(() => {});

    // Load campaigns from API
    fetch("/api/user/campaigns")
      .then((r) => r.json())
      .then((data: Campaign[]) => {
        if (Array.isArray(data)) setCampaigns(data);
      })
      .catch(() => {});
  }, []);

  function updateContact(id: string, field: keyof Contact, value: string) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }
  function removeContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  const validContacts = contacts.filter((c) => c.name || c.email || c.phone);

  async function handleSend() {
    if (!validContacts.length) return;
    setSendError("");

    const platformUrl = googleReviewUrl.trim() || "https://g.page/r/PLACEHOLDER/review";
    const businessId = "placeholder-business-id";

    try {
      await Promise.all(
        validContacts.map((c) =>
          fetch("/api/review-request/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessId,
              name: c.name,
              email: c.email,
              phone: c.phone,
              channel: c.channel.toUpperCase(),
              platformUrl,
              businessName,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Request failed for ${c.name || c.email}`);
          })
        )
      );

      // POST campaign to API
      const campaignPayload = {
        businessName,
        contacts: validContacts,
        messageTemplate: template,
      };
      const campaignRes = await fetch("/api/user/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignPayload),
      });

      if (campaignRes.ok) {
        const created = await campaignRes.json() as Campaign;
        setCampaigns((prev) => [created, ...prev]);
      }

      setContacts([newContact()]);
      setSent(true);
      setTimeout(() => { setSent(false); setTab("history"); }, 1500);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Styled tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid rgba(44,26,14,0.06)", padding: "18px 24px 0", flexShrink: 0, gap: "4px" }}>
        {(["send", "history"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "14px 16px 12px",
                fontSize: "12px",
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.06em",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: `3px solid ${active ? "#2D9B8A" : "transparent"}`,
                color: active ? "#2C1A0E" : "#A0856A",
                marginBottom: "-2px",
                transition: "color 150ms, border-color 150ms",
              }}
            >
              {t === "send" ? "Send Campaign" : `History${campaigns.length > 0 ? ` (${campaigns.length})` : ""}`}
            </button>
          );
        })}
      </div>

      {/* Send tab */}
      {tab === "send" && (
        <UpgradeTooltip locked={!canAccess(plan, "smsCampaigns")} requiredPlan="Pro">
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "14px 24px 0" }}>

          {/* No Google review URL warning */}
          {!googleReviewUrl.trim() && (
            <div style={{
              background: "#C4874A", borderRadius: "12px",
              padding: "12px 16px", marginBottom: "14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "10px", flexShrink: 0,
            }}>
              <p style={{ fontSize: "12px", color: "white", fontWeight: 500, lineHeight: 1.4, flex: 1 }}>
                ⚠️ No Google review link set. Add it in Settings so customers are sent to the right place.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.(6)}
                style={{
                  background: "#2D9B8A", color: "white",
                  borderRadius: "8px", padding: "7px 14px",
                  fontSize: "12px", fontWeight: 600,
                  border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                }}
              >
                Go to Settings
              </button>
            </div>
          )}

          {/* Branded identity pill */}
          <div style={{ background: "#120804", borderRadius: "12px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexShrink: 0, border: "1px solid rgba(45,155,138,0.12)" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#C4874A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 62 19" fill="none" style={{ width: "20px", height: "auto" }}>
                <path d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Vynta Reputation Management</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "1px" }}>Review requests sent via Vynta</p>
            </div>
          </div>

          {/* Form body */}
          <div style={{ background: "#120804", borderRadius: "16px", border: "1px solid rgba(45,155,138,0.12)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0, marginBottom: "14px" }}>

          {/* Business name */}
          <div>
            <label style={{ ...LABEL, color: "rgba(255,255,255,0.35)" }}>Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Marcus's Barbershop"
              style={FIELD}
            />
          </div>

          {/* Customer list */}
          <div>
            <label style={{ ...LABEL, color: "rgba(255,255,255,0.35)" }}>Customers</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {contacts.map((c) => (
                <div key={c.id} style={{ ...CARD, padding: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <input type="text" value={c.name} onChange={(e) => updateContact(c.id, "name", e.target.value)} placeholder="Name" style={FIELD} />
                    <input type="tel" value={c.phone} onChange={(e) => updateContact(c.id, "phone", e.target.value)} placeholder="Phone" style={FIELD} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px", alignItems: "center" }}>
                    <input type="email" value={c.email} onChange={(e) => updateContact(c.id, "email", e.target.value)} placeholder="Email (optional)" style={FIELD} />
                    <select
                      value={c.channel}
                      onChange={(e) => updateContact(c.id, "channel", e.target.value)}
                      style={{ ...FIELD, width: "auto", cursor: "pointer" }}
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="both">Both</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      disabled={contacts.length === 1}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", opacity: contacts.length === 1 ? 0.3 : 1, padding: "4px" }}
                      aria-label="Remove"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setContacts((p) => [...p, newContact()])}
              style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#2D9B8A", fontWeight: 600 }}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px" }}>
                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
              </svg>
              Add customer
            </button>
          </div>

          {/* Message */}
          <div>
            <label style={{ ...LABEL, color: "rgba(255,255,255,0.35)" }}>Message</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              style={{ ...FIELD, resize: "none" }}
            />
          </div>

          {/* Send button */}
          <div>
            {sendError && (
              <p style={{ fontSize: "12px", color: "#C0392B", marginBottom: "8px", textAlign: "center" }}>{sendError}</p>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={validContacts.length === 0 || sent}
              style={{
                width: "100%",
                background: "#2D9B8A",
                color: "white",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                opacity: validContacts.length === 0 || sent ? 0.5 : 1,
                textAlign: "center",
              }}
            >
              {sent
                ? `✓ Sent — ${validContacts.length} request${validContacts.length !== 1 ? "s" : ""} logged`
                : "Send Campaign"}
            </button>
          </div>

          </div>{/* end form body card */}
          <div style={{ paddingBottom: "120px" }} />
        </div>
        </UpgradeTooltip>
      )}

      {/* History tab */}
      {tab === "history" && (
        <UpgradeTooltip locked={!canAccess(plan, "requestHistory")} requiredPlan="Pro">
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 120px" }}>
          {campaigns.length === 0 ? (
            <div style={{ ...CARD, padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>No campaigns sent yet.</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>Add a customer above and send your first review request.</p>
              <button type="button" onClick={() => setTab("send")} style={{ marginTop: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#2D9B8A", fontWeight: 600 }}>
                Send your first campaign →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {campaigns.map((campaign) => (
                <div key={campaign.id} style={{ ...CARD, padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{campaign.businessName || "Unnamed"}</p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>
                        {new Date(campaign.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{campaign.contacts.length} contact{campaign.contacts.length !== 1 ? "s" : ""}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{channelsUsed(campaign)}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                    {campaign.contacts.map((c) => (
                      <span key={c.id} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                        {c.name || c.email || c.phone}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </UpgradeTooltip>
      )}
    </div>
  );
}
