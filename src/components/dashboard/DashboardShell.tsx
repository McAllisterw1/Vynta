"use client";

import { useState } from "react";
import HomeScreen from "./HomeScreen";
import RequestCampaign from "./RequestCampaign";
import SettingsPanel from "./SettingsPanel";
import AnalyticsScreen from "./AnalyticsScreen";
import GoalsScreen from "./GoalsScreen";

// Screen order: analytics=0, requests=1, home=2, goals=3, settings=4
interface Props {
  userName: string;
  plan: string | null;
  subscriptionStatus: string | null;
  email: string;
  firstName: string;
}

const SCREEN: React.CSSProperties = {
  width: "20%",
  flexShrink: 0,
  height: "100%",
  overflow: "hidden",
};

export default function DashboardShell({
  userName,
  plan,
  subscriptionStatus,
  email,
  firstName,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(3); // home by default

  const navigateTo = (index: number) => setActiveIndex(index);
  const goHome = () => setActiveIndex(3);

  const visualPosition: Record<number, number> = { 0: 0, 1: 1, 2: 3, 3: 2, 4: 4 };

  const tabClass = (index: number) =>
    `flex w-16 cursor-pointer flex-col items-center gap-1 py-1 transition-colors ${
      activeIndex === index
        ? "text-tobacco"
        : "text-tobacco-light/50 hover:text-tobacco-light"
    }`;

  return (
    <div
      className="bg-cream"
      style={{ position: "fixed", inset: 0, overflow: "hidden", width: "100%", height: "100%" }}
    >
      <style>{`body { overflow: hidden; }`}</style>

      {/* Carousel track — 500% wide, slides as one unit */}
      <div
        style={{
          display: "flex",
          width: "500%",
          height: "100%",
          transform: `translateX(-${activeIndex * 20}%)`,
          transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        {/* Screen 0: Analytics */}
        <div style={SCREEN}>
          <AnalyticsScreen />
        </div>

        {/* Screen 1: Review Requests */}
        <div style={SCREEN}>
          <RequestCampaign onBack={goHome} />
        </div>

        {/* Screen 2: Goals */}
        <div style={SCREEN}>
          <GoalsScreen />
        </div>

        {/* Screen 3: Home — only scrollable screen */}
        <div style={SCREEN}>
          <HomeScreen plan={plan} subscriptionStatus={subscriptionStatus} />
        </div>

        {/* Screen 4: Settings */}
        <div style={SCREEN}>
          <SettingsPanel
            name={firstName}
            email={email}
            plan={plan}
            subscriptionStatus={subscriptionStatus}
            onBack={goHome}
          />
        </div>
      </div>

      {/* Floating pill nav — fixed, sits above the track */}
      <nav
        className="fixed z-50 rounded-full"
        style={{
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "fit-content",
          background: "#FAF5E8",
          boxShadow:
            "0 4px 24px rgba(44,26,14,0.13), 0 1.5px 6px rgba(44,26,14,0.07), inset 0 0 0 1px rgba(44,26,14,0.07)",
        }}
      >
        <div className="flex flex-col px-6 pt-3 pb-2.5">
          <div className="flex">

            {/* Stats — 0 */}
            <button type="button" onClick={() => navigateTo(0)} className={tabClass(0)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Stats</span>
            </button>

            {/* Requests — 1 */}
            <button type="button" onClick={() => navigateTo(1)} className={tabClass(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Requests</span>
            </button>

            {/* Home — 3 */}
            <button type="button" onClick={() => navigateTo(3)} className={tabClass(3)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Home</span>
            </button>

            {/* Goals — 2 */}
            <button type="button" onClick={() => navigateTo(2)} className={tabClass(2)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Goals</span>
            </button>

            {/* Settings — 4 */}
            <button type="button" onClick={() => navigateTo(4)} className={tabClass(4)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Settings</span>
            </button>

          </div>

          {/* Wave logo indicator */}
          <div className="relative mt-2 h-3">
            <div
              className="absolute left-0 top-0 flex h-full w-1/5 items-center justify-center"
              style={{
                transform: `translateX(${visualPosition[activeIndex] * 100}%)`,
                transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <svg viewBox="0 0 62 19" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-auto">
                <path
                  d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
                  stroke="#C4874A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                <circle cx="5"  cy="3" r="2" fill="#C4874A" />
                <circle cx="17" cy="3" r="2" fill="#C4874A" />
                <circle cx="29" cy="3" r="2" fill="#C4874A" />
                <circle cx="41" cy="3" r="2" fill="#C4874A" />
                <circle cx="53" cy="3" r="2" fill="#C4874A" />
              </svg>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
