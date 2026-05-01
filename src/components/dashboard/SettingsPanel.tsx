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
}

const planBadgeStyle: Record<string, string> = {
  starter: "bg-sand-pale text-tobacco-mid border-sand/50",
  growth:  "bg-teal/10 text-teal border-teal/30",
  agency:  "bg-tobacco/10 text-tobacco border-tobacco/20",
};

export default function SettingsPanel({ name, email, plan, subscriptionStatus }: Props) {
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
    try {
      localStorage.setItem(DEFAULT_BUSINESS_KEY, defaultBusiness.trim());
    } catch {}
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

  return (
    <div className="max-w-2xl">
      <a
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-tobacco-light transition-colors hover:text-tobacco"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </a>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-tobacco">Settings</h1>
        <p className="mt-1 text-sm text-tobacco-light">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col gap-6">

        {/* Profile */}
        <section className="rounded-sm border border-cream-border bg-sand-pale p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-tobacco-mid">Profile</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-tobacco-mid">Name</span>
              <span className="text-sm font-medium text-tobacco">{name || "—"}</span>
            </div>
            <div className="h-px bg-cream-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-tobacco-mid">Email</span>
              <span className="text-sm font-medium text-tobacco">{email || "—"}</span>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="rounded-sm border border-cream-border bg-sand-pale p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-tobacco-mid">Subscription</h2>
          {planData && isActive ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-tobacco-mid">Current plan</span>
              <span className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${planBadgeStyle[plan!] ?? "bg-sand-pale text-tobacco-mid border-cream-border"}`}>
                {planData.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-tobacco-mid">Current plan</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-tobacco-mid">No active subscription</span>
                <a
                  href="/#pricing"
                  className="rounded-sm bg-teal px-3 py-1 text-xs font-medium text-cream transition-colors hover:bg-teal-dark"
                >
                  View plans
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Default business name */}
        <section className="rounded-sm border border-cream-border bg-sand-pale p-6 shadow-sm">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-tobacco-mid">Default Business Name</h2>
          <p className="mb-4 text-xs text-tobacco-light">
            Pre-fills the business name field in the AI Review Responder.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={defaultBusiness}
              onChange={(e) => setDefaultBusiness(e.target.value)}
              placeholder="e.g. Marcus's Barbershop"
              className="flex-1 rounded-sm border border-cream-border bg-cream px-3 py-2 text-sm text-tobacco placeholder:text-tobacco-light/50 outline-none transition-colors focus:border-teal"
            />
            <button
              type="button"
              onClick={handleSaveBusiness}
              disabled={defaultBusiness.trim() === ""}
              className="rounded-sm bg-teal px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </section>

        {/* Response history */}
        <section className="rounded-sm border border-cream-border bg-sand-pale p-6 shadow-sm">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-tobacco-mid">Response History</h2>
          <p className="mb-4 text-xs text-tobacco-light">
            {history.length > 0
              ? `${history.length} saved response${history.length !== 1 ? "s" : ""} stored locally.`
              : "No saved responses yet."}
          </p>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={history.length === 0}
            className="rounded-sm border border-cream-border px-4 py-2 text-sm font-medium text-tobacco-light transition-colors hover:border-tobacco-light hover:text-tobacco disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {cleared ? "Cleared!" : "Clear response history"}
          </button>
        </section>

        {/* Sign out */}
        <section className="rounded-sm border border-cream-border bg-sand-pale p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-tobacco-mid">Account</h2>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-sm border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:border-red-300 cursor-pointer"
          >
            Sign out
          </button>
        </section>

      </div>
    </div>
  );
}
