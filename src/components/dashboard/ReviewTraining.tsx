"use client";

import { useState, useEffect } from "react";

const TRAINING_KEY = "vynta_training";

const BUSINESS_TYPES = ["Plumber", "Barber", "Cleaner", "Contractor", "Landscaper", "Other"];

const MODULES = [
  "Why Reviews Are Money",
  "How Google Decides Who Shows Up",
  "The Right Way to Ask",
  "Your 30 Day Playbook",
];

interface TrainingProfile {
  businessType: string;
  currentReviews: number;
  competitorReviews: number;
}

interface TrainingState {
  profile: TrainingProfile | null;
  completed: [boolean, boolean, boolean, boolean];
  content: [string | null, string | null, string | null, string | null];
}

const INITIAL: TrainingState = {
  profile: null,
  completed: [false, false, false, false],
  content: [null, null, null, null],
};

const CARD: React.CSSProperties = {
  background: "#F0E9D8",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
};

const INPUT: React.CSSProperties = {
  background: "white",
  borderRadius: "10px",
  border: "none",
  boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
  padding: "10px 14px",
  fontSize: "14px",
  color: "#2C1A0E",
  width: "100%",
  outline: "none",
  display: "block",
  boxSizing: "border-box" as const,
};

function buildPrompt(idx: number, p: TrainingProfile): { system: string; message: string } {
  const gap = p.competitorReviews - p.currentReviews;
  const gapText =
    gap > 0
      ? `Their nearest competitor has ${gap} more reviews — a gap they need to close.`
      : gap < 0
      ? `They actually have ${Math.abs(gap)} more reviews than their competitor — they are ahead.`
      : "They and their competitor are tied on reviews.";

  const system = `You are a plain-spoken business coach writing a training module for a ${p.businessType}. They have ${p.currentReviews} Google reviews. Their nearest competitor has ${p.competitorReviews}. ${gapText} Write in a conversational coach voice — direct, warm, no jargon. Short punchy paragraphs of 2–3 sentences. Never use bullet points or numbered lists — always prose. Write specifically for their situation. Aim for 280–340 words.`;

  const prompts = [
    `Write Module 1: Why Reviews Are Money. Open with a direct, specific statement about what more Google reviews actually mean in dollars and new customers for a ${p.businessType}. Make it concrete. End with something that makes them want to act right now.`,
    `Write Module 2: How Google Decides Who Shows Up. Explain in plain terms how Google's local search ranking actually works — what signals it uses, why review count and recency matter, and what being at ${p.currentReviews} reviews versus a competitor at ${p.competitorReviews} actually costs in visibility and lost jobs. Make it feel urgent but not panicked.`,
    `Write Module 3: The Right Way to Ask. Give the exact moment, words, and approach a ${p.businessType} should use to ask a customer for a review right after a job. Include what to say, how to handle hesitation, and what to avoid. Make it feel natural, not pushy.`,
    `Write Module 4: A 30-Day Playbook. Give a concrete, week-by-week plan for this ${p.businessType} to grow their Google reviews starting from ${p.currentReviews}. Be specific about what to do each week. Make it feel achievable for someone running their own business.`,
  ];

  return { system, message: prompts[idx] };
}

export default function ReviewTraining() {
  const [training, setTraining] = useState<TrainingState>(INITIAL);
  const [openModule, setOpenModule] = useState<number | null>(null);
  const [loadingModule, setLoadingModule] = useState<number | null>(null);
  const [form, setForm] = useState({ businessType: "", currentReviews: "", competitorReviews: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRAINING_KEY);
      if (raw) setTraining(JSON.parse(raw));
    } catch {}
  }, []);

  function persist(next: TrainingState) {
    setTraining(next);
    try {
      localStorage.setItem(TRAINING_KEY, JSON.stringify(next));
    } catch {}
  }

  function submitOnboarding() {
    if (!form.businessType || !form.currentReviews || !form.competitorReviews) return;
    persist({
      ...training,
      profile: {
        businessType: form.businessType,
        currentReviews: Number(form.currentReviews),
        competitorReviews: Number(form.competitorReviews),
      },
    });
  }

  async function openAndLoad(idx: number) {
    if (loadingModule !== null) return;

    if (openModule === idx) {
      setOpenModule(null);
      return;
    }

    setOpenModule(idx);

    if (training.content[idx]) return;

    setLoadingModule(idx);
    try {
      const { system, message } = buildPrompt(idx, training.profile!);
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: message }] }),
      });
      const data = await res.json();
      const text: string = data.response ?? "Content unavailable. Please try again.";
      setTraining((prev) => {
        const content = [...prev.content] as TrainingState["content"];
        content[idx] = text;
        const next = { ...prev, content };
        try { localStorage.setItem(TRAINING_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    } catch {
      setTraining((prev) => {
        const content = [...prev.content] as TrainingState["content"];
        content[idx] = "Couldn't load this module. Please try again.";
        const next = { ...prev, content };
        try { localStorage.setItem(TRAINING_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    } finally {
      setLoadingModule(null);
    }
  }

  function markComplete(idx: number) {
    const completed = [...training.completed] as TrainingState["completed"];
    completed[idx] = true;
    persist({ ...training, completed });
    setOpenModule(null);
  }

  const completedCount = training.completed.filter(Boolean).length;
  const formValid = !!form.businessType && !!form.currentReviews && !!form.competitorReviews;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div>
          <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2C1A0E" }}>
            Review Training
          </h2>
          <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>
            Learn the game. Grow your reputation.
          </p>
        </div>
        {training.profile && (
          <span style={{ fontSize: "11px", color: "#A0856A", flexShrink: 0, paddingTop: "4px" }}>
            {completedCount}/4 done
          </span>
        )}
      </div>

      {/* Progress bar */}
      {training.profile && (
        <div
          style={{
            height: "5px",
            borderRadius: "99px",
            background: "rgba(44,26,14,0.1)",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "99px",
              background: "#2D9B8A",
              width: `${(completedCount / 4) * 100}%`,
              transition: "width 500ms",
            }}
          />
        </div>
      )}

      {/* Body */}
      <div>

        {/* Onboarding form */}
        {!training.profile && (
          <div style={{ ...CARD, padding: "14px" }}>
            <p style={{ fontSize: "12px", color: "#A0856A", marginBottom: "10px" }}>
              3 quick questions to personalize your training.
            </p>

            <select
              value={form.businessType}
              onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
              style={{ ...INPUT, marginBottom: "8px", cursor: "pointer" }}
            >
              <option value="">What type of business are you?</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="number"
              min={0}
              value={form.currentReviews}
              onChange={(e) => setForm((f) => ({ ...f, currentReviews: e.target.value }))}
              placeholder="How many Google reviews do you have?"
              style={{ ...INPUT, marginBottom: "8px" }}
            />

            <input
              type="number"
              min={0}
              value={form.competitorReviews}
              onChange={(e) => setForm((f) => ({ ...f, competitorReviews: e.target.value }))}
              placeholder="How many does your nearest competitor have?"
              style={{ ...INPUT, marginBottom: "12px" }}
            />

            <button
              type="button"
              onClick={submitOnboarding}
              disabled={!formValid}
              style={{
                width: "100%",
                background: "#2C1A0E",
                color: "white",
                borderRadius: "10px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: formValid ? "pointer" : "not-allowed",
                opacity: formValid ? 1 : 0.4,
              }}
            >
              Start My Training
            </button>
          </div>
        )}

        {/* Module cards */}
        {training.profile && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {MODULES.map((title, idx) => {
              const isLocked = idx > 0 && !training.completed[idx - 1];
              const isDone = training.completed[idx];
              const isOpen = openModule === idx;
              const isLoading = loadingModule === idx;

              return (
                <div
                  key={idx}
                  style={{
                    ...CARD,
                    overflow: "hidden",
                    background: isDone ? "#E8F5F2" : "#F0E9D8",
                  }}
                >
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => openAndLoad(idx)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "11px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: isLocked ? "default" : "pointer",
                      textAlign: "left",
                    }}
                  >
                    {/* Status circle */}
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isDone
                          ? "#2D9B8A"
                          : isLocked
                          ? "rgba(44,26,14,0.1)"
                          : "#2C1A0E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isDone ? (
                        <svg viewBox="0 0 16 16" fill="white" style={{ width: "11px", height: "11px" }}>
                          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                        </svg>
                      ) : isLocked ? (
                        <svg viewBox="0 0 16 16" fill="rgba(44,26,14,0.3)" style={{ width: "11px", height: "11px" }}>
                          <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1V4.5A3.5 3.5 0 0 0 8 1Zm2 5V4.5a2 2 0 1 0-4 0V6h4Z" />
                        </svg>
                      ) : (
                        <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>{idx + 1}</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: isLocked ? "#A0856A" : "#2C1A0E",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </p>
                      {isLocked && (
                        <p style={{ fontSize: "10px", color: "#A0856A", marginTop: "1px" }}>
                          Complete Module {idx} first
                        </p>
                      )}
                    </div>

                    {!isLocked && !isDone && (
                      <svg
                        viewBox="0 0 16 16"
                        fill="#A0856A"
                        style={{
                          width: "12px",
                          height: "12px",
                          flexShrink: 0,
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 200ms",
                        }}
                      >
                        <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    )}
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(44,26,14,0.08)" }}>
                      {isLoading ? (
                        <div style={{ display: "flex", gap: "4px", padding: "16px 0", justifyContent: "center" }}>
                          {[0, 150, 300].map((delay) => (
                            <span
                              key={delay}
                              className="animate-bounce"
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#A0856A",
                                display: "inline-block",
                                animationDelay: `${delay}ms`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <>
                          <p
                            style={{
                              fontSize: "13px",
                              lineHeight: 1.75,
                              color: "#2C1A0E",
                              paddingTop: "12px",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {training.content[idx]}
                          </p>
                          <button
                            type="button"
                            onClick={() => markComplete(idx)}
                            style={{
                              marginTop: "14px",
                              width: "100%",
                              background: "#2D9B8A",
                              color: "white",
                              borderRadius: "10px",
                              padding: "10px",
                              fontSize: "13px",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Got it — Mark Complete
                          </button>
                        </>
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
