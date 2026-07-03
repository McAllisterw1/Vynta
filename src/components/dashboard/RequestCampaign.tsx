"use client";

import { useState, useEffect, useCallback } from "react";

const CARD: React.CSSProperties = {
  background: "#120804",
  borderRadius: "16px",
  border: "1px solid rgba(45,155,138,0.12)",
};

const TEAL  = "#2D9B8A";
const AMBER = "#C4874A";
const RED   = "#DC2626";
const DARK  = "rgba(255,255,255,0.9)";
const MUTED = "rgba(255,255,255,0.45)";

interface SlimReview {
  rating: number;
  date: string;
  responded: boolean;
}

interface AskScript {
  type: string;
  label: string;
  script: string;
}

function SpinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

function lsSet(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function reviewsNeeded(currentRating: number, targetRating: number, reviewCount: number): number {
  if (targetRating <= currentRating) return 0;
  if (targetRating >= 5) return Math.ceil(reviewCount * (5 - currentRating));
  return Math.ceil(reviewCount * (targetRating - currentRating) / (5 - targetRating));
}

function weeksToTarget(needed: number, perWeek: number): number | null {
  if (perWeek <= 0) return null;
  return Math.ceil(needed / perWeek);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        background: copied ? "rgba(45,155,138,0.15)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${copied ? "rgba(45,155,138,0.3)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "11px",
        fontWeight: 600,
        color: copied ? TEAL : MUTED,
        cursor: "pointer",
        transition: "all 150ms",
        flexShrink: 0,
      }}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export default function RequestCampaign({ plan, onNavigate }: { onBack?: () => void; plan?: string | null; onNavigate?: (tab: number) => void } = {}) {
  const [currentRating,  setCurrentRating]  = useState<number | null>(null);
  const [targetRating,   setTargetRating]   = useState<number>(4.5);
  const [reviewCount,    setReviewCount]    = useState<number>(0);
  const [businessName,   setBusinessName]   = useState("");
  const [businessType,   setBusinessType]   = useState("");
  const [defaultTone,    setDefaultTone]    = useState("professional");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [reviews,        setReviews]        = useState<SlimReview[]>([]);
  const [loading,        setLoading]        = useState(true);

  const [scripts,        setScripts]        = useState<AskScript[] | null>(null);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsError,   setScriptsError]   = useState(false);

  const [weeklyAsks,     setWeeklyAsks]     = useState<Array<{ week: string; count: number }>>([]);
  const [askInput,       setAskInput]       = useState("");
  const [askLogged,      setAskLogged]      = useState(false);

  const [accelTab,       setAccelTab]       = useState<3 | 5 | 10>(5);

  useEffect(() => {
    const cachedScripts = lsGet<AskScript[]>("vynta_ask_scripts");
    if (cachedScripts) setScripts(cachedScripts);

    const cachedLog = lsGet<Array<{ week: string; count: number }>>("vynta_ask_log");
    if (cachedLog) setWeeklyAsks(cachedLog);

    Promise.all([
      fetch("/api/user/settings").then(r => r.json()).catch(() => ({})),
      fetch("/api/user/smart-inbox").then(r => r.json()).catch(() => null),
      fetch("/api/user/reviews?slim=true").then(r => r.json()).catch(() => []),
    ]).then(([settings, inbox, revs]) => {
      const s = settings as {
        googleRating?: number; targetRating?: number; businessName?: string;
        businessType?: string; defaultTone?: string; googleReviewUrl?: string;
      };
      if (s.googleRating && s.googleRating > 0) setCurrentRating(s.googleRating);
      if (s.targetRating) setTargetRating(s.targetRating);
      if (s.businessName) setBusinessName(s.businessName);
      if (s.businessType) setBusinessType(s.businessType);
      if (s.defaultTone)  setDefaultTone(s.defaultTone);
      if (s.googleReviewUrl) setGoogleReviewUrl(s.googleReviewUrl);

      const ib = inbox as { lastKnownCount?: number } | null;
      if (ib?.lastKnownCount) setReviewCount(ib.lastKnownCount);

      if (Array.isArray(revs)) setReviews(revs as SlimReview[]);
    }).finally(() => setLoading(false));
  }, []);

  const monthlyVelocity = (() => {
    if (reviews.length === 0) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return reviews.filter(r => new Date(r.date) >= cutoff).length;
  })();

  const needed = currentRating ? reviewsNeeded(currentRating, targetRating, reviewCount) : null;
  const weeksAtCurrent = (needed !== null && monthlyVelocity > 0)
    ? Math.ceil(needed / (monthlyVelocity / 4.3))
    : null;

  const generateScripts = useCallback(async () => {
    if (scriptsLoading) return;
    setScriptsLoading(true);
    setScriptsError(false);

    const system = "You are a local business reputation coach. Generate natural, human review request scripts. Return ONLY a raw JSON array — no markdown, no backticks.";
    const msg = `Business: ${businessName || "a local business"}. Type: ${businessType || "local business"}. Tone: ${defaultTone}.

Generate exactly 3 short review request scripts a business owner can use to ask customers for a Google review.

Return this exact JSON array:
[
  { "type": "Post-Service", "label": "After a first visit or job", "script": "..." },
  { "type": "Loyal Customer", "label": "For a returning customer", "script": "..." },
  { "type": "After a Fix", "label": "After resolving a complaint", "script": "..." }
]

Rules:
- 2-4 sentences max each
- Natural, human — not corporate or pushy
- Include {link} where the Google review link goes
- Match the tone: ${defaultTone}
- Do not beg or offer incentives`;

    try {
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
      });
      const data = await res.json() as { response?: string };
      const raw = (data.response ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("no json");
      const parsed = JSON.parse(match[0]) as AskScript[];
      setScripts(parsed);
      lsSet("vynta_ask_scripts", parsed);
    } catch {
      setScriptsError(true);
    } finally {
      setScriptsLoading(false);
    }
  }, [businessName, businessType, defaultTone, scriptsLoading]);

  function logWeeklyAsks() {
    const count = parseInt(askInput, 10);
    if (isNaN(count) || count < 0) return;
    const week = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const updated = [{ week, count }, ...weeklyAsks].slice(0, 8);
    setWeeklyAsks(updated);
    lsSet("vynta_ask_log", updated);
    setAskInput("");
    setAskLogged(true);
    setTimeout(() => setAskLogged(false), 2000);
  }

  const ratingGap = currentRating ? Math.max(0, targetRating - currentRating) : 0;
  const progressPct = currentRating
    ? Math.min(100, Math.max(0, ((currentRating - 1) / (targetRating - 1)) * 100))
    : 0;

  void plan;
  void onNavigate;

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "28px 24px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1 }}>
            Review Growth
          </h1>
          <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "5px" }}>
            Your roadmap to a stronger rating
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[120, 100, 80].map(h => (
              <div key={h} style={{ ...CARD, height: h, background: "rgba(18,8,4,0.6)" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* ── Growth Snapshot ── */}
            <div style={{ ...CARD, padding: "18px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEAL, marginBottom: "14px" }}>
                Growth Snapshot
              </p>

              {!currentRating ? (
                <div>
                  <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.6, marginBottom: "12px" }}>
                    Connect your Smart Inbox and set a target rating in Settings to unlock your growth roadmap.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(7)}
                    style={{ background: TEAL, color: "white", borderRadius: "10px", padding: "9px 18px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
                  >
                    Go to Settings →
                  </button>
                </div>
              ) : (
                <>
                  {/* Rating row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <p style={{ fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>Current</p>
                      <p style={{ fontSize: "1.2rem", fontWeight: 800, color: ratingGap > 0.5 ? AMBER : TEAL, lineHeight: 1 }}>{currentRating.toFixed(1)}★</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <p style={{ fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>Target</p>
                      <p style={{ fontSize: "1.2rem", fontWeight: 800, color: TEAL, lineHeight: 1 }}>{targetRating.toFixed(1)}★</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <p style={{ fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>Gap</p>
                      <p style={{ fontSize: "1.2rem", fontWeight: 800, color: ratingGap > 0 ? RED : TEAL, lineHeight: 1 }}>
                        {ratingGap > 0 ? `-${ratingGap.toFixed(1)}★` : "✓"}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ height: "6px", borderRadius: "99px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "99px", background: `linear-gradient(90deg, ${TEAL}, ${AMBER})`, width: `${progressPct}%`, transition: "width 600ms" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{ fontSize: "9px", color: MUTED }}>1★</span>
                      <span style={{ fontSize: "9px", color: MUTED }}>{targetRating}★ target</span>
                    </div>
                  </div>

                  {/* Key numbers */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {needed !== null && needed > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: "11px", color: MUTED }}>5-star reviews needed</p>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: DARK }}>{needed.toLocaleString()}</p>
                      </div>
                    )}
                    {needed === 0 && (
                      <p style={{ fontSize: "12px", color: TEAL, fontWeight: 600 }}>You&apos;ve hit your target rating! 🎉</p>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "11px", color: MUTED }}>Reviews this month</p>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: DARK }}>{monthlyVelocity}</p>
                    </div>
                    {reviewCount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: "11px", color: MUTED }}>Total Google reviews</p>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: DARK }}>{reviewCount.toLocaleString()}</p>
                      </div>
                    )}
                    {weeksAtCurrent !== null && needed !== null && needed > 0 && (
                      <div style={{ background: "rgba(196,135,74,0.08)", border: "1px solid rgba(196,135,74,0.15)", borderRadius: "8px", padding: "8px 12px", marginTop: "4px" }}>
                        <p style={{ fontSize: "11px", color: AMBER, lineHeight: 1.5 }}>
                          At your current pace, you&apos;ll hit {targetRating}★ in <strong>~{weeksAtCurrent} weeks</strong>.
                        </p>
                      </div>
                    )}
                    {monthlyVelocity === 0 && needed !== null && needed > 0 && (
                      <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.12)", borderRadius: "8px", padding: "8px 12px", marginTop: "4px" }}>
                        <p style={{ fontSize: "11px", color: RED, lineHeight: 1.5 }}>
                          No new reviews detected this month — use the scripts below to start asking.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Accelerator ── */}
            {currentRating && needed !== null && needed > 0 && (
              <div style={{ ...CARD, padding: "18px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEAL, marginBottom: "12px" }}>
                  Accelerator
                </p>
                <p style={{ fontSize: "11px", color: MUTED, marginBottom: "12px" }}>
                  If you collect this many 5-star reviews per week:
                </p>
                <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                  {([3, 5, 10] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAccelTab(n)}
                      style={{
                        flex: 1,
                        background: accelTab === n ? TEAL : "rgba(255,255,255,0.06)",
                        border: `1px solid ${accelTab === n ? TEAL : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "8px",
                        padding: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: accelTab === n ? "white" : MUTED,
                        cursor: "pointer",
                      }}
                    >
                      {n}/wk
                    </button>
                  ))}
                </div>
                {(() => {
                  const weeks = weeksToTarget(needed, accelTab);
                  if (!weeks) return null;
                  const months = (weeks / 4.3).toFixed(1);
                  return (
                    <div style={{ background: "rgba(45,155,138,0.06)", border: "1px solid rgba(45,155,138,0.18)", borderRadius: "10px", padding: "12px 14px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: DARK, marginBottom: "3px" }}>
                        You&apos;d hit {targetRating}★ in ~{weeks} weeks
                      </p>
                      <p style={{ fontSize: "11px", color: MUTED }}>
                        That&apos;s about {months} months — asking {accelTab} customers per week for a Google review.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Ask Scripts ── */}
            <div style={{ ...CARD, padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEAL }}>
                  Ask Scripts
                </p>
                {scripts && (
                  <button
                    type="button"
                    onClick={() => { lsSet("vynta_ask_scripts", null); setScripts(null); }}
                    style={{ background: "none", border: "none", fontSize: "10px", color: MUTED, cursor: "pointer" }}
                  >
                    Regenerate
                  </button>
                )}
              </div>

              {scriptsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "20px 0" }}>
                  <SpinIcon size={13} />
                  <p style={{ fontSize: "12px", color: MUTED }}>Writing scripts for your business…</p>
                </div>
              ) : scriptsError ? (
                <div>
                  <p style={{ fontSize: "12px", color: MUTED, marginBottom: "10px" }}>Couldn&apos;t generate scripts — try again.</p>
                  <button type="button" onClick={generateScripts}
                    style={{ background: TEAL, color: "white", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                    Retry
                  </button>
                </div>
              ) : scripts ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {scripts.map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div>
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEAL }}>{s.type}</span>
                          <span style={{ fontSize: "10px", color: MUTED, marginLeft: "8px" }}>{s.label}</span>
                        </div>
                        <CopyButton text={s.script.replace("{link}", googleReviewUrl || "[your review link]")} />
                      </div>
                      <p style={{ fontSize: "12px", color: DARK, lineHeight: 1.65 }}>
                        {s.script.replace("{link}", googleReviewUrl || "[your review link]")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "12px", color: MUTED, lineHeight: 1.6, marginBottom: "12px" }}>
                    Get 3 AI-written review request scripts tailored to your business type and tone — post-service, loyal customer, and after resolving a complaint.
                  </p>
                  <button
                    type="button"
                    onClick={generateScripts}
                    style={{ width: "100%", background: TEAL, color: "white", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
                  >
                    Generate Ask Scripts
                  </button>
                </div>
              )}
            </div>

            {/* ── Weekly Ask Log ── */}
            <div style={{ ...CARD, padding: "18px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEAL, marginBottom: "12px" }}>
                Weekly Ask Log
              </p>
              <p style={{ fontSize: "11px", color: MUTED, marginBottom: "12px" }}>
                Track how many customers you asked for a review this week.
              </p>
              <div style={{ display: "flex", gap: "8px", marginBottom: weeklyAsks.length > 0 ? "14px" : "0" }}>
                <input
                  type="number"
                  min={0}
                  value={askInput}
                  onChange={e => setAskInput(e.target.value)}
                  placeholder="e.g. 7"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(45,155,138,0.2)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    color: DARK,
                    outline: "none",
                    colorScheme: "dark",
                  }}
                />
                <button
                  type="button"
                  onClick={logWeeklyAsks}
                  disabled={!askInput || isNaN(parseInt(askInput, 10))}
                  style={{
                    background: askLogged ? "rgba(45,155,138,0.15)" : TEAL,
                    color: "white",
                    borderRadius: "10px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background 150ms",
                  }}
                >
                  {askLogged ? "Logged ✓" : "Log"}
                </button>
              </div>

              {weeklyAsks.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {weeklyAsks.map((entry, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < weeklyAsks.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <span style={{ fontSize: "11px", color: MUTED }}>Week of {entry.week}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: entry.count >= 5 ? TEAL : entry.count >= 3 ? AMBER : DARK }}>
                        {entry.count} asked
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
