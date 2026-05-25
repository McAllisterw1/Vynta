"use client";

import { useState, useEffect } from "react";

const MODULES = [
  { title: "Why Reviews Are Money",          emoji: "💰", sub: "The dollar value hiding in your star rating" },
  { title: "How Google Decides Who Shows Up", emoji: "🔍", sub: "The algorithm nobody explains in plain English" },
  { title: "The Right Way to Ask",            emoji: "🤝", sub: "The exact moment, words, and approach that work" },
  { title: "Customer Psychology & Reviews",   emoji: "🧠", sub: "Why people leave reviews — and how to influence it" },
  { title: "Your 30-Day Playbook",            emoji: "📅", sub: "Week-by-week plan from today to momentum" },
  { title: "How Trust Is Built Online",       emoji: "🛡️", sub: "The signals strangers use before they ever call you" },
  { title: "How to Beat the Algorithm",       emoji: "⚡", sub: "Insider game mechanics most owners never learn" },
];

const TOTAL = MODULES.length;

interface TrainingProfile {
  businessType: string;
  currentReviews: number;
  competitorReviews: number;
}

interface TrainingState {
  profile: TrainingProfile | null;
  completed: boolean[];
  content: (string | null)[];
}

const INITIAL: TrainingState = {
  profile: null,
  completed: Array(TOTAL).fill(false),
  content: Array(TOTAL).fill(null),
};

const INPUT: React.CSSProperties = {
  background: "white",
  borderRadius: "10px",
  border: "1px solid rgba(44,26,14,0.1)",
  padding: "12px 16px",
  fontSize: "14px",
  color: "#2C1A0E",
  width: "100%",
  outline: "none",
  display: "block",
  boxSizing: "border-box" as const,
};

function buildPrompt(idx: number, p: TrainingProfile, competitorContext?: string): { system: string; message: string } {
  const gap = p.competitorReviews - p.currentReviews;
  const gapText =
    gap > 0
      ? `Their nearest competitor has ${gap} more reviews — a gap they need to close.`
      : gap < 0
      ? `They actually have ${Math.abs(gap)} more reviews than their competitor — they are ahead.`
      : "They and their competitor are tied on reviews.";

  const competitorLine = competitorContext ? ` Additional competitor landscape: ${competitorContext}.` : "";
  const system = `You are a plain-spoken business coach writing a training module for a ${p.businessType}. They have ${p.currentReviews} Google reviews. Their nearest competitor has ${p.competitorReviews}. ${gapText}${competitorLine} Write in a conversational coach voice — direct, warm, no jargon. Short punchy paragraphs of 2–3 sentences. Never use bullet points or numbered lists — always prose. Write specifically for their situation.`;

  const prompts = [
    `Write Module 1: Why Reviews Are Money. Aim for 280–340 words. Open with a direct, specific statement about what more Google reviews actually mean in dollars and new customers for a ${p.businessType}. Make it concrete — use real numbers and scenarios. Cover: how reviews directly affect whether a new customer calls or scrolls past; what the difference between 50 and 150 reviews actually looks like in monthly revenue; why this is the highest-leverage marketing a ${p.businessType} can do; and why most business owners ignore it until it's too late. End with something that makes them want to act right now.`,

    `Write Module 2: How Google Decides Who Shows Up. Aim for 300–360 words. Explain in plain terms how Google's local search ranking actually works — the three signals it weighs, why review count and recency matter above almost everything else, and what being at ${p.currentReviews} reviews versus a competitor at ${p.competitorReviews} reviews actually costs in daily visibility and lost jobs. Cover: what the map pack is and why it's the only thing that matters; how Google interprets review velocity as a trust signal; why a business with fewer reviews but recent ones often beats an older business with more; and what this ${p.businessType} needs to do to start winning those signals. Make it feel urgent but not panicked.`,

    `Write Module 3: The Right Way to Ask. Aim for 300–360 words. Give the exact moment, words, and approach a ${p.businessType} should use to ask a customer for a review right after delivering great service. Cover: when is the single best moment to ask; what to say word for word — make it feel natural, human; how to handle a customer who hesitates; what channels work and which one this business should lead with; and what most business owners do wrong that kills the ask before it starts. Make it feel like advice from someone who's actually done this.`,

    `Write Module 4: Customer Psychology & Online Reviews. Aim for 340–400 words. Go deep on why customers actually leave reviews — the real psychological triggers. Cover: the asymmetry of motivation (why a frustrated customer is 3x more likely to write a review than a happy one); the role of identity — how leaving a review lets a customer feel like a helper or a voice; social proof and anchoring — how a ${p.businessType} with 200 reviews makes a shopper feel safe; what makes someone feel compelled vs. indifferent after a transaction; how to engineer the post-service experience so the emotional moment is at its peak when you ask; and what the research says about star ratings — the counterintuitive truth that 4.6 converts better than 5.0. Write like a coach who has studied how customers think.`,

    `Write Module 5: A 30-Day Playbook. Aim for 340–400 words. Give a concrete, week-by-week plan for this ${p.businessType} to grow their Google reviews starting from ${p.currentReviews}. Be specific — not general goals, but actual actions. Cover: Week 1 (set up the foundation — review link, ask process, team briefing); Week 2 (start the ask habit with every new customer and follow up with past customers); Week 3 (analyze what's working, respond to every review received, adjust the ask); Week 4 (build in systems so this keeps running without manual effort). Include how to stay consistent when things get busy and what success looks like at day 30. Make it feel achievable for someone running their own business.`,

    `Write Module 6: How Trust Is Built Online. Aim for 340–400 words. Explain exactly how a stranger decides whether to trust a ${p.businessType} they found on Google — before they ever call. Cover: the 8-second decision window — what a customer sees and concludes in the first moment; how review count creates a "safe crowd" feeling; why review recency signals that the business is still alive and cares; how responding to reviews (especially negative ones) is one of the most trust-building actions a business can take publicly; how photo count, business description completeness, and Q&A sections signal legitimacy; and the difference between a business that looks like it's being watched (trusted) versus one that looks abandoned. Make this feel like pulling back a curtain.`,

    `Write Module 7: How to Beat the Algorithm. Aim for 360–420 words. Write this like an insider pulling back the curtain — not a textbook, but a mentor who actually knows how the game is played. Cover: how Google's local search algorithm works in plain English — the three pillars (relevance, distance, prominence) and which one this business can actually move; what Google is really looking at when it decides who lands in the map pack; the specific signals that matter most: review volume, recency, response rate, keyword mentions inside review text; what competitors with more reviews are doing that makes Google favor them; why getting 10 reviews in one week is less powerful than 2 a week for five weeks; and what this ${p.businessType} with ${p.currentReviews} reviews can do right now against a competitor at ${p.competitorReviews} reviews. Make it feel like they just learned something most owners never figure out. No bullet points — prose only.`,
  ];

  return { system, message: prompts[idx] };
}

function normalizeState(raw: Partial<TrainingState>): TrainingState {
  const completed = Array(TOTAL).fill(false).map((_, i) => raw.completed?.[i] ?? false);
  const content = Array(TOTAL).fill(null).map((_, i) => raw.content?.[i] ?? null);
  return { profile: raw.profile ?? null, completed, content };
}

export default function ReviewTraining() {
  const [training, setTraining] = useState<TrainingState>(INITIAL);
  const [openModule, setOpenModule] = useState<number | null>(null);
  const [loadingModule, setLoadingModule] = useState<number | null>(null);
  const [form, setForm] = useState({ businessType: "", currentReviews: "", competitorReviews: "" });
  const [view, setView] = useState<"modules" | "library">("modules");

  useEffect(() => {
    fetch("/api/user/training")
      .then((r) => r.json())
      .then((data: Partial<TrainingState> | null) => {
        if (data) setTraining(normalizeState(data));
      })
      .catch(() => {});
  }, []);

  async function persist(next: TrainingState) {
    setTraining(next);
    try {
      await fetch("/api/user/training", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch {}
  }

  function submitOnboarding() {
    if (!form.businessType.trim() || !form.currentReviews || !form.competitorReviews) return;
    void persist({
      ...training,
      profile: {
        businessType: form.businessType.trim(),
        currentReviews: Number(form.currentReviews),
        competitorReviews: Number(form.competitorReviews),
      },
    });
  }

  async function openAndLoad(idx: number) {
    if (loadingModule !== null) return;
    if (openModule === idx) { setOpenModule(null); return; }
    setOpenModule(idx);
    if (training.content[idx]) return;

    setLoadingModule(idx);
    try {
      let competitorContext: string | undefined;
      try {
        const compsRes = await fetch("/api/user/competitors");
        const comps = await compsRes.json() as Array<{ name: string; rating: number; reviewCount: number }>;
        if (comps.length > 0) competitorContext = comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ");
      } catch {}

      const { system, message } = buildPrompt(idx, training.profile!, competitorContext);
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: message }] }),
      });
      const data = await res.json() as { response?: string };
      const text = data.response?.trim() ?? "Content unavailable. Please try again.";

      setTraining((prev) => {
        const content = [...prev.content];
        content[idx] = text;
        const next = { ...prev, content };
        void fetch("/api/user/training", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) }).catch(() => {});
        return next;
      });
    } catch {
      setTraining((prev) => {
        const content = [...prev.content];
        content[idx] = "Couldn't load this module. Please try again.";
        const next = { ...prev, content };
        void fetch("/api/user/training", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) }).catch(() => {});
        return next;
      });
    } finally {
      setLoadingModule(null);
    }
  }

  function markComplete(idx: number) {
    const completed = [...training.completed];
    completed[idx] = true;
    void persist({ ...training, completed });
    setOpenModule(null);
  }

  const completedCount = training.completed.filter(Boolean).length;
  const formValid = !!form.businessType.trim() && !!form.currentReviews && !!form.competitorReviews;
  const pct = Math.round((completedCount / TOTAL) * 100);

  return (
    <div style={{ padding: "0 0 80px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .module-content { animation: slideDown 200ms ease both; }
      `}</style>

      {/* ── Sticky header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "#FAF5E8",
        borderBottom: "1px solid rgba(44,26,14,0.07)",
        padding: "20px 32px 16px",
      }}>
        {/* Back + title row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
          <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#A0856A", textDecoration: "none", flexShrink: 0 }}>
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "11px", height: "11px" }}>
              <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7.5H13a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
            </svg>
            Dashboard
          </a>
          <div style={{ flex: 1 }}>
            <h1 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2C1A0E", lineHeight: 1 }}>
              Training Academy
            </h1>
            <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>
              {training.profile
                ? `${completedCount} of ${TOTAL} modules complete · ${pct}%`
                : "Personalize your training to begin"}
            </p>
          </div>
          {training.profile && completedCount > 0 && (
            <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
              {(["modules", "library"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setView(tab)}
                  style={{
                    padding: "6px 14px", fontSize: "11px", fontWeight: 600,
                    borderRadius: "20px", border: "none", cursor: "pointer",
                    background: view === tab ? "#2C1A0E" : "transparent",
                    color: view === tab ? "white" : "#A0856A",
                    transition: "all 150ms",
                  }}
                >
                  {tab === "modules" ? "Modules" : `Library (${completedCount})`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {training.profile && (
          <div style={{ display: "flex", gap: "3px" }}>
            {MODULES.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: "4px", borderRadius: "99px",
                  background: training.completed[i] ? "#2D9B8A" : i === completedCount ? "rgba(44,26,14,0.15)" : "rgba(44,26,14,0.08)",
                  transition: "background 400ms",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "24px 32px 0" }}>

        {/* Onboarding form */}
        {!training.profile && (
          <div style={{
            background: "#E8DCC8",
            borderRadius: "20px",
            padding: "28px",
            maxWidth: "560px",
          }}>
            <div style={{ marginBottom: "20px" }}>
              <h2 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px" }}>
                Set up your training
              </h2>
              <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.6 }}>
                Three quick inputs and the AI personalizes every module to your exact business and situation.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "6px" }}>
                  What type of business do you run?
                </label>
                <input
                  type="text"
                  value={form.businessType}
                  onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
                  placeholder="e.g. Plumber, Auto Shop, Dentist, Restaurant…"
                  style={INPUT}
                  autoFocus
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "6px" }}>
                    Your Google reviews
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.currentReviews}
                    onChange={(e) => setForm((f) => ({ ...f, currentReviews: e.target.value }))}
                    placeholder="e.g. 47"
                    style={INPUT}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", display: "block", marginBottom: "6px" }}>
                    Nearest competitor's
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.competitorReviews}
                    onChange={(e) => setForm((f) => ({ ...f, competitorReviews: e.target.value }))}
                    placeholder="e.g. 120"
                    style={INPUT}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={submitOnboarding}
                disabled={!formValid}
                style={{
                  marginTop: "6px",
                  background: "#2C1A0E", color: "white",
                  borderRadius: "12px", padding: "13px 20px",
                  fontSize: "14px", fontWeight: 700, border: "none",
                  cursor: formValid ? "pointer" : "not-allowed",
                  opacity: formValid ? 1 : 0.4,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                Begin Training →
              </button>
            </div>
          </div>
        )}

        {/* Session Library */}
        {view === "library" && training.profile && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MODULES.map(({ title, emoji, sub }, idx) => {
              if (!training.completed[idx] || !training.content[idx]) return null;
              const isOpen = openModule === idx;
              return (
                <div key={idx} style={{
                  background: "white", borderRadius: "16px",
                  border: "1px solid rgba(45,155,138,0.2)",
                  overflow: "hidden",
                }}>
                  <button
                    type="button"
                    onClick={() => setOpenModule(isOpen ? null : idx)}
                    style={{
                      width: "100%", background: "none", border: "none",
                      padding: "18px 22px", display: "flex", alignItems: "center",
                      gap: "14px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "22px", flexShrink: 0 }}>{emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E" }}>{title}</p>
                      <p style={{ fontSize: "11px", color: "#2D9B8A", marginTop: "2px" }}>✓ Completed · Saved</p>
                    </div>
                    <svg viewBox="0 0 16 16" fill="#A0856A" style={{ width: "13px", height: "13px", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }}>
                      <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="module-content" style={{ padding: "0 22px 22px", borderTop: "1px solid rgba(44,26,14,0.06)" }}>
                      <p style={{ fontSize: "11px", color: "#A0856A", paddingTop: "12px", marginBottom: "12px" }}>{sub}</p>
                      <p style={{ fontSize: "14px", lineHeight: 1.85, color: "#2C1A0E", whiteSpace: "pre-wrap" }}>
                        {training.content[idx]}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Module list */}
        {view === "modules" && training.profile && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MODULES.map(({ title, emoji, sub }, idx) => {
              const isLocked = idx > 0 && !training.completed[idx - 1];
              const isDone = training.completed[idx];
              const isOpen = openModule === idx;
              const isLoading = loadingModule === idx;

              return (
                <div
                  key={idx}
                  style={{
                    background: isOpen ? "white" : isDone ? "rgba(45,155,138,0.05)" : "white",
                    borderRadius: "16px",
                    border: isOpen
                      ? "2px solid #2D9B8A"
                      : isDone
                      ? "1px solid rgba(45,155,138,0.25)"
                      : isLocked
                      ? "1px solid rgba(44,26,14,0.06)"
                      : "1px solid rgba(44,26,14,0.1)",
                    overflow: "hidden",
                    opacity: isLocked ? 0.55 : 1,
                    transition: "border-color 200ms, opacity 200ms",
                    boxShadow: isOpen ? "0 4px 24px rgba(45,155,138,0.12)" : "0 1px 4px rgba(44,26,14,0.06)",
                  }}
                >
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => openAndLoad(idx)}
                    style={{
                      width: "100%", background: "none", border: "none",
                      padding: "18px 22px", display: "flex", alignItems: "center",
                      gap: "14px", cursor: isLocked ? "default" : "pointer", textAlign: "left",
                    }}
                  >
                    {/* Number badge */}
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                      background: isDone ? "#2D9B8A" : isLocked ? "rgba(44,26,14,0.08)" : "#2C1A0E",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isDone ? (
                        <svg viewBox="0 0 16 16" fill="white" style={{ width: "13px", height: "13px" }}>
                          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                        </svg>
                      ) : isLocked ? (
                        <svg viewBox="0 0 16 16" fill="rgba(44,26,14,0.25)" style={{ width: "12px", height: "12px" }}>
                          <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1V4.5A3.5 3.5 0 0 0 8 1Zm2 5V4.5a2 2 0 1 0-4 0V6h4Z" />
                        </svg>
                      ) : (
                        <span style={{ color: "white", fontSize: "12px", fontWeight: 800, fontFamily: "monospace" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "16px", lineHeight: 1 }}>{emoji}</span>
                        <p style={{
                          fontSize: "14px", fontWeight: 700,
                          color: isLocked ? "#A0856A" : "#2C1A0E",
                        }}>
                          {title}
                        </p>
                      </div>
                      <p style={{ fontSize: "11px", color: isDone ? "#2D9B8A" : "#A0856A" }}>
                        {isDone ? "Complete · Tap to re-read" : isLocked ? `Finish module ${idx} to unlock` : sub}
                      </p>
                    </div>

                    {/* Chevron */}
                    {!isLocked && (
                      <svg viewBox="0 0 16 16" fill={isDone ? "#2D9B8A" : "#A0856A"} style={{
                        width: "13px", height: "13px", flexShrink: 0,
                        transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms",
                      }}>
                        <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    )}
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="module-content" style={{ borderTop: "1px solid rgba(44,26,14,0.07)" }}>
                      {isLoading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 22px", gap: "12px" }}>
                          <div style={{ display: "flex", gap: "5px" }}>
                            {[0, 150, 300].map((d) => (
                              <span key={d} className="animate-bounce" style={{
                                width: "7px", height: "7px", borderRadius: "50%",
                                background: "#2D9B8A", display: "inline-block", animationDelay: `${d}ms`,
                              }} />
                            ))}
                          </div>
                          <p style={{ fontSize: "12px", color: "#A0856A" }}>Building your personalized module…</p>
                        </div>
                      ) : (
                        <div style={{ padding: "24px 28px" }}>
                          {/* Module label */}
                          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2D9B8A", marginBottom: "16px" }}>
                            Module {String(idx + 1).padStart(2, "0")} — {sub}
                          </p>

                          {/* Content */}
                          <div style={{
                            fontSize: "15px", lineHeight: 1.85, color: "#2C1A0E",
                            whiteSpace: "pre-wrap", fontFamily: "Georgia, serif",
                          }}>
                            {training.content[idx]}
                          </div>

                          {/* Action */}
                          <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(44,26,14,0.07)" }}>
                            {!isDone ? (
                              <button
                                type="button"
                                onClick={() => markComplete(idx)}
                                style={{
                                  background: "#2C1A0E", color: "white",
                                  borderRadius: "12px", padding: "13px 24px",
                                  fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer",
                                  display: "inline-flex", alignItems: "center", gap: "8px",
                                }}
                              >
                                <svg viewBox="0 0 16 16" fill="white" style={{ width: "12px", height: "12px" }}>
                                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                                </svg>
                                Got it — Mark Complete
                              </button>
                            ) : (
                              <p style={{ fontSize: "12px", color: "#2D9B8A", fontWeight: 600 }}>
                                ✓ Saved to your Session Library
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
