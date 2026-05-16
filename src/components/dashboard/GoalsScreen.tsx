"use client";

import { useState, useEffect, useRef } from "react";

const GOALS_KEY = "vynta_goals";
const HISTORY_KEY = "vynta_response_history";
const REQUESTS_KEY = "vynta_requests_sent";
const CAMPAIGNS_KEY = "vynta_campaigns";

const CARD: React.CSSProperties = {
  background: "#E8DCC8",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
};

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  completed: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface NextMove {
  emoji: string;
  title: string;
  description: string;
  action_label: string;
  action_tab: "requests" | "reviews" | "training" | "home" | "stats";
}

const TAB_INDEX: Record<string, number> = {
  stats: 0,
  requests: 1,
  reviews: 2,
  home: 3,
};

function buildSystemPrompt(): string {
  try {
    const goals = JSON.parse(localStorage.getItem(GOALS_KEY) || "[]") as Goal[];
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Array<{ rating: number; createdAt: string }>;
    const requestsSent = localStorage.getItem(REQUESTS_KEY) || "0";
    const campaigns = JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || "[]") as unknown[];
    const now = new Date();
    const monthKey = `vynta_usage_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usage = localStorage.getItem(monthKey) || "0";
    const avg = history.length > 0 ? (history.reduce((s, e) => s + e.rating, 0) / history.length).toFixed(1) : "N/A";
    const goalsText = goals.length > 0
      ? goals.map((g) => `"${g.title}" — ${g.current}/${g.target} (${g.completed ? "done" : "in progress"})`).join("; ")
      : "No goals set yet.";
    return `You are Vynta's AI Review Consultant — a sharp, friendly reputation coach for small business owners. You have access to this user's real data:\n\nGoals: ${goalsText}\nTotal responses generated: ${history.length}\nAverage rating: ${avg}\nReview requests sent: ${requestsSent}\nMonthly usage: ${usage} responses this month\nCampaigns: ${campaigns.length} sent\n\nGive specific, actionable advice based on their actual numbers. Be concise, direct, and encouraging. Reference their data naturally in responses.`;
  } catch {
    return "You are Vynta's AI Review Consultant — a sharp, friendly reputation coach for small business owners. Give specific, actionable advice. Be concise, direct, and encouraging.";
  }
}

const BLANK = { title: "", target: "", current: "", deadline: "" };

interface Props {
  onNavigate?: (tab: number) => void;
}

export default function GoalsScreen({ onNavigate }: Props = {}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [trainingCompleted, setTrainingCompleted] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // "Your Next Move" state
  const [nextMoves, setNextMoves] = useState<NextMove[]>([]);
  const [nextMovesLoading, setNextMovesLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GOALS_KEY);
      if (stored) setGoals(JSON.parse(stored));
    } catch {}
    try {
      const raw = localStorage.getItem("vynta_training");
      if (raw) {
        const parsed = JSON.parse(raw);
        const count = (parsed.completed as boolean[]).filter(Boolean).length;
        setTrainingCompleted(count);
      }
    } catch {}
  }, []);

  // Fetch "Your Next Move" cards on mount
  useEffect(() => {
    let totalReviews = 0;
    let avgRating: number | null = null;
    let requestsSent = 0;
    let unrespondedCount = 0;
    let trainingCount = 0;
    let responseHistoryCount = 0;

    try {
      const stats = JSON.parse(localStorage.getItem("vynta_stats") || "null") as { totalReviews?: number; avgRating?: number | null } | null;
      if (stats) {
        totalReviews = stats.totalReviews ?? 0;
        avgRating = stats.avgRating ?? null;
      }
    } catch {}

    try {
      requestsSent = parseInt(localStorage.getItem("vynta_requests_sent") || "0", 10) || 0;
    } catch {}

    try {
      const ourReviews = JSON.parse(localStorage.getItem("vynta_our_reviews") || "[]") as Array<{ responded: boolean }>;
      unrespondedCount = ourReviews.filter((r) => !r.responded).length;
    } catch {}

    try {
      const training = JSON.parse(localStorage.getItem("vynta_training") || "null") as { completed: boolean[] } | null;
      if (training?.completed) {
        trainingCount = training.completed.filter(Boolean).length;
      }
    } catch {}

    try {
      const history = JSON.parse(localStorage.getItem("vynta_response_history") || "[]") as unknown[];
      responseHistoryCount = history.length;
    } catch {}

    // Build greeting from data — no API needed
    const parts: string[] = [];
    if (totalReviews > 0) {
      parts.push(`${totalReviews} review${totalReviews !== 1 ? "s" : ""}`);
      if (avgRating !== null) parts.push(`a ${avgRating} avg`);
    }
    if (unrespondedCount > 0) parts.push(`${unrespondedCount} unresponded`);
    setGreeting(
      parts.length > 0
        ? `You have ${parts.join(", ")}. Here's what to do next.`
        : "Here's what to focus on next."
    );

    // Call Claude for personalised next-move cards
    const system = `You are a reputation growth coach inside the Vynta dashboard. Based on the user's real data, generate exactly 3 actionable next steps as a JSON array. Be specific to their numbers. Sound like a coach, not a robot. No fluff. Return only valid JSON, no markdown, no explanation.

Each item in the array must have exactly these keys:
- emoji: a single relevant emoji
- title: 5 words max, punchy
- description: 1 sentence, specific to their data
- action_label: 2-3 words (e.g. "Send Request", "Reply Now", "Start Training")
- action_tab: exactly one of "requests", "reviews", "training", "home", "stats"`;

    const userMessage = `User data:
- Total logged reviews: ${totalReviews}
- Average rating: ${avgRating ?? "no data yet"}
- Review requests sent: ${requestsSent}
- Reviews with no response logged: ${unrespondedCount}
- Training modules completed: ${trainingCount} of 5
- AI responses generated: ${responseHistoryCount}

Generate 3 specific, coach-style next steps based on these exact numbers.`;

    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: userMessage }] }),
    })
      .then((res) => res.json())
      .then((data: { response?: string }) => {
        const raw = data.response ?? "";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned) as NextMove[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNextMoves(parsed.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setNextMovesLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function save(updated: Goal[]) {
    setGoals(updated);
    try { localStorage.setItem(GOALS_KEY, JSON.stringify(updated)); } catch {}
  }

  function addGoal() {
    if (!form.title.trim() || !form.target) return;
    save([...goals, {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      target: Math.max(1, Number(form.target) || 1),
      current: Math.max(0, Number(form.current) || 0),
      deadline: form.deadline,
      completed: false,
    }]);
    setForm(BLANK);
    setShowForm(false);
  }

  function toggleComplete(id: string) {
    save(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)));
  }
  function deleteGoal(id: string) {
    save(goals.filter((g) => g.id !== id));
  }

  function handleNextMoveAction(tab: string) {
    if (tab === "training") {
      window.location.href = "/dashboard/training";
      return;
    }
    const idx = TAB_INDEX[tab];
    if (idx !== undefined && onNavigate) onNavigate(idx);
  }

  async function sendPrompt(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: buildSystemPrompt(), messages: updated }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.response ?? "No response." }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Couldn't connect. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function sendMessage() {
    sendPrompt(input);
  }

  return (
    <div ref={scrollRef} style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "24px 24px 120px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── Your Next Move ── */}
        <div>
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D9B8A", marginBottom: "4px" }}>
              ⚡ Your Next Move
            </p>
            <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.5 }}>{greeting}</p>
          </div>

          {/* Cards — horizontal scroll row */}
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px", scrollbarWidth: "none" } as React.CSSProperties}>
            {nextMovesLoading ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    ...CARD,
                    minWidth: "190px",
                    flex: "0 0 190px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    opacity: 0.5,
                  }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(44,26,14,0.1)" }} />
                  <div style={{ height: "14px", borderRadius: "6px", background: "rgba(44,26,14,0.1)", width: "80%" }} />
                  <div style={{ height: "10px", borderRadius: "6px", background: "rgba(44,26,14,0.07)", width: "100%" }} />
                  <div style={{ height: "10px", borderRadius: "6px", background: "rgba(44,26,14,0.07)", width: "70%" }} />
                  <div style={{ height: "32px", borderRadius: "8px", background: "rgba(44,26,14,0.08)", marginTop: "auto" }} />
                </div>
              ))
            ) : nextMoves.length > 0 ? (
              nextMoves.map((move, i) => (
                <div
                  key={i}
                  style={{
                    ...CARD,
                    minWidth: "190px",
                    flex: "0 0 190px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "26px", lineHeight: 1 }}>{move.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#2C1A0E", marginBottom: "4px", lineHeight: 1.3 }}>
                      {move.title}
                    </p>
                    <p style={{ fontSize: "11px", color: "#7B5E45", lineHeight: 1.55 }}>
                      {move.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNextMoveAction(move.action_tab)}
                    style={{
                      background: "#2D9B8A",
                      color: "white",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "center",
                      marginTop: "auto",
                    }}
                  >
                    {move.action_label}
                  </button>
                </div>
              ))
            ) : null}
          </div>
        </div>

        {/* ── Goals section ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2C1A0E" }}>Goals</h2>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              style={{ background: "#2D9B8A", color: "white", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              + Add
            </button>
          </div>

          {showForm && (
            <div style={{ ...CARD, padding: "14px", marginBottom: "12px" }}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Goal title"
                style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "10px 14px", fontSize: "14px", color: "#2C1A0E", width: "100%", outline: "none", marginBottom: "8px", boxSizing: "border-box" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <input type="number" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} placeholder="Target" min={1}
                  style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "10px 14px", fontSize: "14px", color: "#2C1A0E", outline: "none" }} />
                <input type="number" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} placeholder="Current" min={0}
                  style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "10px 14px", fontSize: "14px", color: "#2C1A0E", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={addGoal} disabled={!form.title.trim() || !form.target}
                  style={{ background: "#2C1A0E", color: "white", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>Add</button>
                <button type="button" onClick={() => { setShowForm(false); setForm(BLANK); }}
                  style={{ background: "white", color: "#A0856A", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#A0856A", textAlign: "center", padding: "20px 0" }}>No goals yet. Add one above to start tracking your progress.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {goals.map((g) => {
                const pct = Math.min(Math.round((g.current / g.target) * 100), 100);
                return (
                  <div key={g.id} style={{ ...CARD, padding: "12px 16px", background: g.completed ? "#E8F5F2" : "#E8DCC8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: g.completed ? "#A0856A" : "#2C1A0E", textDecoration: g.completed ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "#A0856A", flexShrink: 0 }}>{g.current}/{g.target}</span>
                      <button type="button" onClick={() => toggleComplete(g.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}>
                        {g.completed ? "✓" : "○"}
                      </button>
                      <button type="button" onClick={() => deleteGoal(g.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#A0856A", flexShrink: 0 }}>
                        <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "12px", height: "12px" }}>
                          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                        </svg>
                      </button>
                    </div>
                    <div style={{ marginTop: "8px", height: "6px", borderRadius: "99px", background: "rgba(44,26,14,0.1)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "99px", background: g.completed ? "#2D9B8A" : "#C4874A", width: `${pct}%`, transition: "width 400ms" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Review Training card ── */}
        <div style={{ ...CARD, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>
              <p className="font-display" style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E" }}>Review Training</p>
              <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>Learn the game. Grow your reputation.</p>
            </div>
            <span style={{ fontSize: "11px", color: "#A0856A", flexShrink: 0, paddingTop: "2px" }}>{trainingCompleted}/5</span>
          </div>
          <div style={{ height: "4px", borderRadius: "99px", background: "rgba(44,26,14,0.1)", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ height: "100%", borderRadius: "99px", background: "#2D9B8A", width: `${(trainingCompleted / 5) * 100}%`, transition: "width 500ms" }} />
          </div>
          <a
            href="/dashboard/training"
            style={{ display: "block", textAlign: "center", background: "#2C1A0E", color: "white", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
          >
            {trainingCompleted > 0 ? "Continue Training" : "Start Training"}
          </a>
        </div>

        {/* ── AI Consultant — fixed-height scrollable card ── */}
        <div style={{ ...CARD, height: "500px", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Chat header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(44,26,14,0.07)", flexShrink: 0 }}>
            <p className="font-display" style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E" }}>AI Review Consultant</p>
            <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>Powered by your real data. Ask anything.</p>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.length === 0 && (
              <p style={{ fontSize: "12px", color: "#A0856A", textAlign: "center", alignSelf: "center", marginTop: "16px" }}>
                Ask for advice on your goals or reputation strategy.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%",
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  background: m.role === "user" ? "#2C1A0E" : "#E8DCC8",
                  color: m.role === "user" ? "white" : "#2C1A0E",
                  boxShadow: "0 1px 4px rgba(44,26,14,0.1)",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#FAF5E8", borderRadius: "18px 18px 18px 4px", padding: "10px 16px", boxShadow: "0 1px 4px rgba(44,26,14,0.1)" }}>
                  <span style={{ display: "flex", gap: "4px" }}>
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="animate-bounce" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#A0856A", display: "inline-block", animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length === 0 && (
            <div style={{ padding: "8px 14px 0", display: "flex", gap: "6px", overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" } as React.CSSProperties}>
              {[
                "How do I get more 5-star reviews?",
                "What should I do about a bad review?",
                "What is hurting my reputation?",
                "Analyze my current review stats",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendPrompt(prompt)}
                  disabled={loading}
                  style={{
                    flexShrink: 0,
                    background: "#E8DCC8",
                    color: "#2C1A0E",
                    border: "none",
                    borderRadius: "20px",
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    opacity: loading ? 0.4 : 1,
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(44,26,14,0.07)", flexShrink: 0 }}>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your review consultant…"
                disabled={loading}
                style={{ flex: 1, background: "white", borderRadius: "99px", border: "none", boxShadow: "0 2px 8px rgba(44,26,14,0.1)", padding: "11px 18px", fontSize: "13px", color: "#2C1A0E", outline: "none" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#2C1A0E", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || loading ? 0.4 : 1 }}
                aria-label="Send"
              >
                <svg viewBox="0 0 16 16" fill="white" style={{ width: "15px", height: "15px" }}>
                  <path d="M2.75 3.587A1 1 0 0 1 3.917 2.5l9.666 4.833a1 1 0 0 1 0 1.334L3.917 13.5A1 1 0 0 1 2.75 12.413V9.25l5.5-1.25-5.5-1.25V3.587Z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
