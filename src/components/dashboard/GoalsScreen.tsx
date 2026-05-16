"use client";

import { useState, useEffect, useRef } from "react";

const GOALS_KEY = "vynta_goals";
const HISTORY_KEY = "vynta_response_history";
const REQUESTS_KEY = "vynta_requests_sent";
const CAMPAIGNS_KEY = "vynta_campaigns";

const CARD: React.CSSProperties = {
  background: "#F0E9D8",
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

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [trainingCompleted, setTrainingCompleted] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  function setCurrent(id: string, val: number) {
    save(goals.map((g) => (g.id === id ? { ...g, current: val } : g)));
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
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

  return (
    <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* ── Goals section — top 35% ── */}
      <div style={{ flex: "0 0 35%", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", padding: "20px 24px 12px", borderBottom: "1px solid rgba(44,26,14,0.08)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexShrink: 0 }}>
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
          <div style={{ ...CARD, padding: "14px", marginBottom: "10px", flexShrink: 0 }}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Goal title"
              style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "10px 14px", fontSize: "14px", color: "#2C1A0E", width: "100%", outline: "none", marginBottom: "8px" }}
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

        <div style={{ flex: 1, overflowY: "auto" }}>
          {goals.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#A0856A", textAlign: "center", paddingTop: "16px" }}>No goals yet. Add one above.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {goals.map((g) => {
                const pct = Math.min(Math.round((g.current / g.target) * 100), 100);
                return (
                  <div key={g.id} style={{ ...CARD, padding: "12px 16px", background: g.completed ? "#E8F5F2" : "#F0E9D8" }}>
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
      </div>

      {/* ── Review Training card ── */}
      <div style={{ padding: "12px 24px", flexShrink: 0, borderBottom: "1px solid rgba(44,26,14,0.08)" }}>
        <div style={{ ...CARD, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>
              <p className="font-display" style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E" }}>Review Training</p>
              <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>Learn the game. Grow your reputation.</p>
            </div>
            <span style={{ fontSize: "11px", color: "#A0856A", flexShrink: 0, paddingTop: "2px" }}>{trainingCompleted}/4</span>
          </div>
          <div style={{ height: "4px", borderRadius: "99px", background: "rgba(44,26,14,0.1)", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ height: "100%", borderRadius: "99px", background: "#2D9B8A", width: `${(trainingCompleted / 4) * 100}%`, transition: "width 500ms" }} />
          </div>
          <a
            href="/dashboard/training"
            style={{ display: "block", textAlign: "center", background: "#2C1A0E", color: "white", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
          >
            {trainingCompleted > 0 ? "Continue Training" : "Start Training"}
          </a>
        </div>
      </div>

      {/* ── AI Consultant — remaining ~65% ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Chat header */}
        <div style={{ ...CARD, margin: "12px 24px 0", padding: "12px 16px", flexShrink: 0, borderRadius: "12px" }}>
          <p className="font-display" style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E" }}>AI Review Consultant</p>
          <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "2px" }}>Powered by your real data. Ask anything.</p>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {messages.length === 0 && (
            <p style={{ fontSize: "12px", color: "#A0856A", textAlign: "center", alignSelf: "center", marginTop: "16px" }}>
              Ask for advice on your goals or reputation strategy.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "10px 14px",
                fontSize: "13px",
                lineHeight: 1.5,
                background: m.role === "user" ? "#2C1A0E" : "#F0E9D8",
                color: m.role === "user" ? "white" : "#2C1A0E",
                boxShadow: "0 1px 4px rgba(44,26,14,0.1)",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: "#F0E9D8", borderRadius: "18px 18px 18px 4px", padding: "10px 16px", boxShadow: "0 1px 4px rgba(44,26,14,0.1)" }}>
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

        {/* Input bar */}
        <div style={{ padding: "10px 24px", paddingBottom: "calc(10px + 120px)", flexShrink: 0 }}>
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your review consultant…"
              disabled={loading}
              style={{ flex: 1, background: "white", borderRadius: "99px", border: "none", boxShadow: "0 2px 8px rgba(44,26,14,0.1)", padding: "12px 20px", fontSize: "14px", color: "#2C1A0E", outline: "none" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#2C1A0E", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || loading ? 0.4 : 1 }}
              aria-label="Send"
            >
              <svg viewBox="0 0 16 16" fill="white" style={{ width: "16px", height: "16px" }}>
                <path d="M2.75 3.587A1 1 0 0 1 3.917 2.5l9.666 4.833a1 1 0 0 1 0 1.334L3.917 13.5A1 1 0 0 1 2.75 12.413V9.25l5.5-1.25-5.5-1.25V3.587Z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
