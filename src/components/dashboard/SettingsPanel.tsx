"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useResponseHistory } from "@/lib/useResponseHistory";
import { getPlan } from "@/lib/plans";

const DEFAULT_BUSINESS_KEY = "vynta_default_business";

interface Props {
  name: string;
  email: string;
  plan: string | null;
  subscriptionStatus: string | null;
  onBack?: () => void;
}

const CARD: React.CSSProperties = {
  background: "#F0E9D8",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
};

const DIVIDER: React.CSSProperties = {
  height: "1px",
  background: "rgba(44,26,14,0.06)",
  margin: "0 -20px",
};

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  starter: { bg: "#F0E9D8", text: "#A0856A" },
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_BUSINESS_KEY);
      if (stored) setDefaultBusiness(stored);
    } catch {}
  }, []);

  function handleSaveBusiness() {
    try { localStorage.setItem(DEFAULT_BUSINESS_KEY, defaultBusiness.trim()); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  const planData = getPlan(plan);
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const planColors = plan ? (PLAN_COLORS[plan] ?? PLAN_COLORS.starter) : PLAN_COLORS.starter;

  return (
    <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", padding: "24px 24px 0" }}>

      <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "20px", flexShrink: 0 }}>Settings</h1>

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
          style={{ background: "white", color: "#A0856A", borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", cursor: "pointer", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          {cleared ? "Cleared!" : "Clear"}
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        style={{ width: "100%", background: "transparent", border: "1.5px solid #FCA5A5", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 600, color: "#EF4444", cursor: "pointer", marginBottom: "120px", flexShrink: 0 }}
      >
        Sign out
      </button>
    </div>
  );
}
