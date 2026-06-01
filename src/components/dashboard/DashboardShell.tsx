"use client";

import { useState, useEffect, useRef } from "react";
import IntelligenceScreen from "./IntelligenceScreen";
import RequestCampaign from "./RequestCampaign";
import OurReviewsScreen from "./OurReviewsScreen";
import HomeScreen from "./HomeScreen";
import GoalsScreen from "./GoalsScreen";
import ReportsScreen from "./ReportsScreen";
import SettingsPanel from "./SettingsPanel";
import OnboardingWizard from "./OnboardingWizard";
import CompetitorScreen from "./CompetitorScreen";

interface Props {
  userName: string;
  plan: string | null;
  subscriptionStatus: string | null;
  email: string;
  firstName: string;
}

// Tab indices: 0=Intel 1=Requests 2=Reviews 3=Home 4=Goals 5=Rivals 6=Reports 7=Settings
export default function DashboardShell({
  userName,
  plan,
  subscriptionStatus,
  email,
  firstName,
}: Props) {
  const [active, setActive] = useState(3); // Home
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState<number | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clientBusiness, setClientBusiness] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardSettings, setWizardSettings] = useState<{
    businessName: string; businessType: string; businessAddress: string;
    businessUrl: string; businessPhone: string; googleReviewUrl: string;
    defaultTone: string; messageTemplate: string;
  } | null>(null);
  const [wizardHasInbox, setWizardHasInbox] = useState(false);
  const [smartInboxEnabled, setSmartInboxEnabled] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/settings").then((r) => r.json()),
      fetch("/api/user/smart-inbox").then((r) => r.json()).catch(() => null),
    ]).then(([settings, inbox]: [
      { businessName?: string; businessType?: string; businessAddress?: string; businessUrl?: string; businessPhone?: string; googleReviewUrl?: string; defaultTone?: string; messageTemplate?: string; onboardingComplete?: boolean },
      { enabled?: boolean } | null
    ]) => {
      if (settings.businessName) setClientBusiness(settings.businessName);
      if (inbox?.enabled) {
        setSmartInboxEnabled(true);
      } else {
        try {
          const cached = localStorage.getItem("vynta_smart_inbox_config");
          if (cached && (JSON.parse(cached) as { enabled?: boolean })?.enabled) setSmartInboxEnabled(true);
        } catch {}
      }
      if (!settings.onboardingComplete) {
        setWizardSettings({
          businessName: settings.businessName ?? "",
          businessType: settings.businessType ?? "",
          businessAddress: settings.businessAddress ?? "",
          businessUrl: settings.businessUrl ?? "",
          businessPhone: settings.businessPhone ?? "",
          googleReviewUrl: settings.googleReviewUrl ?? "",
          defaultTone: settings.defaultTone ?? "professional",
          messageTemplate: settings.messageTemplate ?? "",
        });
        setWizardHasInbox(!!(inbox?.enabled));
        setShowWizard(true);
      }
    }).catch(() => {});
  }, []);

  function openWizard() {
    fetch("/api/user/settings").then((r) => r.json()).then((settings: {
      businessName?: string; businessType?: string; businessAddress?: string; businessUrl?: string;
      businessPhone?: string; googleReviewUrl?: string; defaultTone?: string; messageTemplate?: string;
    }) => {
      setWizardSettings({
        businessName: settings.businessName ?? "",
        businessType: settings.businessType ?? "",
        businessAddress: settings.businessAddress ?? "",
        businessUrl: settings.businessUrl ?? "",
        businessPhone: settings.businessPhone ?? "",
        googleReviewUrl: settings.googleReviewUrl ?? "",
        defaultTone: settings.defaultTone ?? "professional",
        messageTemplate: settings.messageTemplate ?? "",
      });
    }).catch(() => {
      setWizardSettings({ businessName: "", businessType: "", businessAddress: "", businessUrl: "", businessPhone: "", googleReviewUrl: "", defaultTone: "professional", messageTemplate: "" });
    });
    fetch("/api/user/smart-inbox").then((r) => r.json()).then((inbox: { enabled?: boolean } | null) => {
      setWizardHasInbox(!!(inbox?.enabled));
    }).catch(() => {});
    setShowWizard(true);
  }

  const navigate = (i: number) => {
    if (i === active) return;
    setDirection(i > active ? "forward" : "backward");
    setActive(i);
    setAnimating(i);
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => setAnimating(null), 400);
  };

  const tab = (i: number) =>
    `flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-0.5 transition-colors ${
      active === i ? "text-teal" : "text-tobacco-light/50 hover:text-tobacco-light"
    }`;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#FAF5E8", display: "flex", flexDirection: "column" }}>
      {showWizard && wizardSettings && (
        <OnboardingWizard
          firstName={firstName}
          initialSettings={wizardSettings}
          hasSmartInbox={wizardHasInbox}
          onDone={() => { setShowWizard(false); }}
        />
      )}
      <style>{`
        body { overflow: hidden; }
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .screen-forward  { animation: slideInFromRight 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .screen-backward { animation: slideInFromLeft  400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        body.modal-open nav { display: none !important; }
      `}</style>

      {/* ── Global brand bar ── */}
      <div style={{
        height: "42px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        background: "#FAF5E8",
        borderBottom: "1px solid rgba(44,26,14,0.07)",
        zIndex: 20,
      }}>
        {/* Vynta logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <svg viewBox="0 0 62 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: "16px", width: "auto" }}>
            <path d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
              stroke="#C4874A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="5"  cy="3" r="2" fill="#C4874A" />
            <circle cx="17" cy="3" r="2" fill="#C4874A" />
            <circle cx="29" cy="3" r="2" fill="#C4874A" />
            <circle cx="41" cy="3" r="2" fill="#C4874A" />
            <circle cx="53" cy="3" r="2" fill="#C4874A" />
          </svg>
          <span className="font-display" style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2C1A0E" }}>
            Vynta
          </span>
        </div>

        {/* Client business name */}
        {clientBusiness && (
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "10px", color: "rgba(44,26,14,0.25)", fontWeight: 400 }}>×</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D9B8A", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {clientBusiness}
            </span>
          </div>
        )}
      </div>

      {/* ── Screen content — all screens stay mounted to avoid re-fetch on navigation ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div className={animating === 0 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 0 ? "block" : "none" }}>
          <IntelligenceScreen />
        </div>
        <div className={animating === 1 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 1 ? "block" : "none" }}>
          <RequestCampaign onBack={() => navigate(3)} plan={plan} onNavigate={navigate} />
        </div>
        <div className={animating === 2 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 2 ? "block" : "none" }}>
          <OurReviewsScreen plan={plan} smartInboxEnabled={smartInboxEnabled} />
        </div>
        <div className={animating === 3 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 3 ? "block" : "none" }}>
          <HomeScreen plan={plan} subscriptionStatus={subscriptionStatus} />
        </div>
        <div className={animating === 4 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 4 ? "block" : "none" }}>
          <GoalsScreen onNavigate={navigate} plan={plan} />
        </div>
        <div className={animating === 5 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 5 ? "block" : "none" }}>
          <CompetitorScreen />
        </div>
        <div className={animating === 6 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 6 ? "block" : "none" }}>
          <ReportsScreen plan={plan} />
        </div>
        <div className={animating === 7 ? `screen-${direction}` : ""} style={{ position: "absolute", inset: 0, display: active === 7 ? "block" : "none" }}>
          <SettingsPanel name={firstName} email={email} plan={plan} subscriptionStatus={subscriptionStatus} onBack={() => navigate(3)} onOpenWizard={openWizard} />
        </div>
      </div>

      {/* Floating pill nav */}
      <nav
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 40px)",
          maxWidth: "480px",
          background: "rgba(232,220,200,0.82)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: 999,
          boxShadow: "0 4px 24px rgba(44,26,14,0.13), 0 1.5px 6px rgba(44,26,14,0.07), inset 0 0 0 1px rgba(44,26,14,0.07)",
          zIndex: 50,
        }}
      >
        <div className="flex flex-col px-3 pt-1.5 pb-1.5">
          <div className="flex">

            {/* Intel — 0 */}
            <button type="button" onClick={() => navigate(0)} className={tab(0)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Intel</span>
            </button>

            {/* Requests — 1 */}
            <button type="button" onClick={() => navigate(1)} className={tab(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Requests</span>
            </button>

            {/* Reviews — 2 */}
            <button type="button" onClick={() => navigate(2)} className={tab(2)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Reviews</span>
            </button>

            {/* Home — 3 */}
            <button type="button" onClick={() => navigate(3)} className={tab(3)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Home</span>
            </button>

            {/* Goals — 4 */}
            <button type="button" onClick={() => navigate(4)} className={tab(4)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Goals</span>
            </button>

            {/* Rivals — 5 */}
            <button type="button" onClick={() => navigate(5)} className={tab(5)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Rivals</span>
            </button>

            {/* Reports — 6 */}
            <button type="button" onClick={() => navigate(6)} className={tab(6)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Reports</span>
            </button>

            {/* Settings — 7 */}
            <button type="button" onClick={() => navigate(7)} className={tab(7)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span className="text-[8px] font-semibold uppercase tracking-wider">Settings</span>
            </button>

          </div>

          {/* Sliding dot indicator — 8 tabs */}
          <div className="relative mt-1 h-1">
            <div
              className="absolute left-0 top-0 flex h-full w-[12.5%] items-center justify-center"
              style={{
                transform: `translateX(${active * 100}%)`,
                transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div style={{ width: "20px", height: "3px", borderRadius: "99px", background: "#C4874A" }} />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
