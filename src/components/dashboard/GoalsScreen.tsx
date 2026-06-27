"use client";

import { useState, useEffect, useRef } from "react";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";
import MarkdownContent from "@/components/ui/MarkdownContent";

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
  action_tab: "requests" | "reviews" | "home" | "stats";
}

const TAB_INDEX: Record<string, number> = {
  stats: 0,
  requests: 1,
  reviews: 2,
  home: 3,
};

const BLANK = { title: "", target: "", current: "", deadline: "" };

const TEMPLATES = [
  { id: "reviews",  emoji: "⭐", label: "Grow review count",   desc: "Get to a target number of Google reviews" },
  { id: "rating",   emoji: "📈", label: "Improve rating",       desc: "Aim for a higher star average" },
  { id: "requests", emoji: "📨", label: "Send more requests",   desc: "Track outbound review requests this month" },
  { id: "training", emoji: "🎓", label: "Complete training",    desc: "Finish your reputation training modules" },
  { id: "custom",   emoji: "✏️",  label: "Custom goal",          desc: "Set your own title and target" },
] as const;
type TemplateId = typeof TEMPLATES[number]["id"];

interface Props {
  onNavigate?: (tab: number) => void;
  plan?: string | null;
}

export default function GoalsScreen({ onNavigate, plan }: Props = {}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
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

// Consultant system prompt data
  const [consultantData, setConsultantData] = useState({
    businessName: "",
    goalsText: "No goals set yet.",
    historyCount: 0,
    totalLoggedReviews: 0,
    googleReviewCount: null as number | null,
    avgRating: "N/A",
    requestsSent: 0,
    monthlyUsage: "0",
    campaignsCount: 0,
    competitorText: "none added",
  });

  useEffect(() => {
    // Load goals from API
    fetch("/api/user/goals")
      .then((r) => r.json())
      .then((data: Goal[]) => {
        if (Array.isArray(data)) setGoals(data);
      })
      .catch(() => {});

    // Load training from API
    fetch("/api/user/training")
      .then((r) => r.json())
      .then((data: { completed?: boolean[] } | null) => {
        if (data?.completed) {
          setTrainingCompleted(data.completed.filter(Boolean).length);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch "Your Next Move" cards on mount
  useEffect(() => {
    let totalReviews = 0;
    let avgRating: number | null = null;
    let requestsSent = 0;
    let unrespondedCount = 0;
    let trainingCount = 0;
    let responseHistoryCount = 0;
    let competitorContext = "No competitor data available.";

    // Parallel fetches for all data needed
    Promise.all([
      fetch("/api/user/reviews").then((r) => r.json()).catch(() => []),
      fetch("/api/user/campaigns").then((r) => r.json()).catch(() => []),
      fetch("/api/user/training").then((r) => r.json()).catch(() => null),
      fetch("/api/user/response-history").then((r) => r.json()).catch(() => []),
      fetch("/api/user/competitors").then((r) => r.json()).catch(() => []),
      fetch("/api/user/goals").then((r) => r.json()).catch(() => []),
      fetch("/api/user/smart-inbox").then((r) => r.json()).catch(() => null),
    ]).then(([reviews, campaigns, training, responseHistory, competitors, goalsData, smartInbox]) => {
      // Reviews
      if (Array.isArray(reviews)) {
        totalReviews = reviews.length;
        avgRating = reviews.length > 0
          ? parseFloat((reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length).toFixed(1))
          : null;
        unrespondedCount = (reviews as Array<{ responded: boolean }>).filter((r) => !r.responded).length;
      }

      // Campaigns
      if (Array.isArray(campaigns)) {
        requestsSent = campaigns.reduce((sum: number, c: { contacts: unknown[] }) => sum + (Array.isArray(c.contacts) ? c.contacts.length : 0), 0);
      }

      // Training
      if (training?.completed) {
        trainingCount = (training.completed as boolean[]).filter(Boolean).length;
      }

      // Response history
      if (Array.isArray(responseHistory)) {
        responseHistoryCount = responseHistory.length;
      }

      // Competitors
      if (Array.isArray(competitors) && competitors.length > 0) {
        competitorContext = (competitors as Array<{ name: string; rating: number; reviewCount: number }>)
          .map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ");
      }

      // Goals for consultant
      const goalsForConsultant = Array.isArray(goalsData) ? goalsData as Goal[] : [];

      // Smart Inbox — verified Google data from Outscraper
      const inbox = smartInbox as { enabled?: boolean; businessName?: string; lastKnownCount?: number } | null;
      const googleReviewCount = inbox?.enabled ? (inbox.lastKnownCount ?? null) : null;
      const businessName = inbox?.businessName ?? "";

      // Update consultant data
      setConsultantData({
        businessName,
        goalsText: goalsForConsultant.length > 0
          ? goalsForConsultant.map((g) => `"${g.title}" — ${g.current}/${g.target} (${g.completed ? "done" : "in progress"})`).join("; ")
          : "No goals set yet.",
        historyCount: responseHistoryCount,
        totalLoggedReviews: totalReviews,
        googleReviewCount,
        avgRating: avgRating !== null ? String(avgRating) : "N/A",
        requestsSent,
        monthlyUsage: "0",
        campaignsCount: Array.isArray(campaigns) ? campaigns.length : 0,
        competitorText: competitorContext === "No competitor data available." ? "none added" : competitorContext,
      });

      // Build greeting
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
- action_label: 2-3 words (e.g. "Send Request", "Reply Now", "View Stats")
- action_tab: exactly one of "requests", "reviews", "home", "stats"
- NEVER suggest "training" as an action_tab — training has its own dedicated button`;

      const userMessage = `User data:
- Total logged reviews: ${totalReviews}
- Average rating: ${avgRating ?? "no data yet"}
- Review requests sent: ${requestsSent}
- Reviews with no response logged: ${unrespondedCount}
- Training modules completed: ${trainingCount} of 5
- AI responses generated: ${responseHistoryCount}
- Competitor context: ${competitorContext}

Generate 3 specific, coach-style next steps. Where relevant, reference how this business compares to its competitors.`;

      return fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: userMessage }] }),
      });
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

  async function addGoal() {
    if (!form.title.trim() || !form.target) return;
    const payload = {
      title: form.title.trim(),
      target: Math.max(1, Number(form.target) || 1),
      current: Math.max(0, Number(form.current) || 0),
      deadline: form.deadline,
      completed: false,
    };
    // Optimistic update with temp id
    const tempId = `temp-${Date.now()}`;
    setGoals((prev) => [...prev, { ...payload, id: tempId }]);
    setForm(BLANK);
    setShowForm(false);
    try {
      const res = await fetch("/api/user/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json() as Goal;
        setGoals((prev) => prev.map((g) => g.id === tempId ? created : g));
      }
    } catch {}
  }

  function selectTemplate(id: TemplateId) {
    const googleCount = consultantData.googleReviewCount ?? consultantData.totalLoggedReviews;
    const currentRating = consultantData.avgRating !== "N/A" ? Math.round(parseFloat(consultantData.avgRating)) : 4;

    let title = "";
    let target = "";
    let current = "0";

    switch (id) {
      case "reviews": {
        const suggested = googleCount < 25 ? 25 : googleCount < 50 ? 50 : googleCount < 100 ? 100 : Math.ceil(googleCount * 1.5 / 25) * 25;
        title = `Get to ${suggested} Google reviews`;
        target = String(suggested);
        current = String(googleCount);
        break;
      }
      case "rating":
        title = "Hit a 5-star average";
        target = "5";
        current = String(currentRating);
        break;
      case "requests":
        title = "Send 20 review requests this month";
        target = "20";
        current = "0";
        break;
      case "training":
        title = "Complete all 5 training modules";
        target = "5";
        current = String(trainingCompleted);
        break;
      case "custom":
        title = "";
        target = "";
        current = "0";
        break;
    }
    setForm({ title, target, current, deadline: "" });
    setSelectedTemplate(id);
  }

  function cancelGoalForm() {
    setShowForm(false);
    setSelectedTemplate(null);
    setForm(BLANK);
  }

  async function toggleComplete(id: string) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const completed = !goal.completed;
    // Optimistic update
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, completed } : g));
    try {
      await fetch(`/api/user/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
    } catch {}
  }

  async function deleteGoal(id: string) {
    // Optimistic update
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await fetch(`/api/user/goals/${id}`, { method: "DELETE" });
    } catch {}
  }

  function handleNextMoveAction(tab: string) {
    const idx = TAB_INDEX[tab];
    if (idx !== undefined && onNavigate) onNavigate(idx);
  }

  function buildSystemPrompt(): string {
    const reviewLine = consultantData.googleReviewCount !== null
      ? `${consultantData.googleReviewCount} verified on Google (live sync), ${consultantData.totalLoggedReviews} imported into Vynta — ${consultantData.avgRating} star average`
      : `${consultantData.totalLoggedReviews} logged in Vynta — ${consultantData.avgRating} star average`;

    return `You are Vynta — a sharp, straight-talking reputation strategist who has helped hundreds of local businesses dominate their Google rankings. You are working with ${consultantData.businessName || "this business"} right now.

You know the local service business game cold. You give direct, specific advice — no hedging, no filler. When there's an easy win, you point to it immediately. When something isn't working, you say so plainly and tell them what to do instead. You have a confident edge but you're rooting for them.

This user's real data:
- Reviews: ${reviewLine}
- Goals: ${consultantData.goalsText}
- AI responses generated: ${consultantData.historyCount}
- Review requests sent: ${consultantData.requestsSent}
- Campaigns sent: ${consultantData.campaignsCount}
- Competitors: ${consultantData.competitorText}

Give specific, actionable advice based on their actual numbers. Never start a response with "Great question" or any filler opener. Get straight to the point.`;
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

        {/* ── Page header with Training button ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div />
          <a
            href="/dashboard/training"
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "#2C1A0E", color: "white", borderRadius: "12px",
              padding: "9px 14px", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.04em", textDecoration: "none",
              boxShadow: "0 2px 8px rgba(44,26,14,0.2)",
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6" style={{ width: "14px", height: "14px", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 2L3 6v5c0 4 3 6.5 7 7 4-.5 7-3 7-7V6L10 2z" />
            </svg>
            Training
          </a>
        </div>

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
                    <div style={{ fontSize: "11px", color: "#7B5E45", lineHeight: 1.55 }}>
                      <MarkdownContent>{move.description}</MarkdownContent>
                    </div>
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
        <UpgradeTooltip locked={!canAccess(plan, "goals")} requiredPlan="Agency">
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2C1A0E" }}>Goals</h2>
            <button
              type="button"
              onClick={() => {
                const next = !showForm;
                setShowForm(next);
                if (next) { setSelectedTemplate(null); setForm(BLANK); }
              }}
              style={{ background: "#2D9B8A", color: "white", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              {showForm ? "✕" : "+ Add"}
            </button>
          </div>

          {showForm && (
            <div style={{ ...CARD, padding: "16px", marginBottom: "12px" }}>
              {selectedTemplate === null ? (
                /* ── Step 1: template picker ── */
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", marginBottom: "12px" }}>
                    What do you want to achieve?
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTemplate(t.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          background: "white", border: "none", borderRadius: "10px",
                          padding: "11px 14px", cursor: "pointer", textAlign: "left",
                          boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
                        }}
                      >
                        <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>{t.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E", margin: 0 }}>{t.label}</p>
                          <p style={{ fontSize: "11px", color: "#A0856A", margin: 0, marginTop: "2px" }}>{t.desc}</p>
                        </div>
                        <svg viewBox="0 0 16 16" fill="none" stroke="#A0856A" strokeWidth="1.5" style={{ width: "14px", height: "14px", flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l5 5-5 5" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={cancelGoalForm}
                    style={{ marginTop: "10px", background: "none", border: "none", fontSize: "12px", color: "#A0856A", cursor: "pointer", padding: "4px 0" }}>
                    Cancel
                  </button>
                </div>
              ) : (
                /* ── Step 2: pre-filled form ── */
                <div>
                  <button type="button" onClick={() => setSelectedTemplate(null)}
                    style={{ background: "none", border: "none", fontSize: "12px", color: "#A0856A", cursor: "pointer", padding: "0 0 12px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "12px", height: "12px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13L5 8l5-5" />
                    </svg>
                    Back
                  </button>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Goal title"
                    style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "10px 14px", fontSize: "14px", color: "#2C1A0E", width: "100%", outline: "none", marginBottom: "8px", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "#A0856A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Target</p>
                      <input
                        type="number"
                        value={form.target}
                        onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                        placeholder="e.g. 100"
                        min={1}
                        autoFocus={selectedTemplate === "custom"}
                        style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "10px 14px", fontSize: "14px", color: "#2C1A0E", outline: "none", width: "100%", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "#A0856A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Current</p>
                      <input
                        type="number"
                        value={form.current}
                        onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                        placeholder="e.g. 0"
                        min={0}
                        style={{ background: "white", borderRadius: "10px", border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", padding: "10px 14px", fontSize: "14px", color: "#2C1A0E", outline: "none", width: "100%", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={addGoal} disabled={!form.title.trim() || !form.target}
                      style={{ background: "#2C1A0E", color: "white", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", opacity: (!form.title.trim() || !form.target) ? 0.4 : 1 }}>
                      Add Goal
                    </button>
                    <button type="button" onClick={cancelGoalForm}
                      style={{ background: "white", color: "#A0856A", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, border: "none", boxShadow: "0 1px 4px rgba(44,26,14,0.08)", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
        </UpgradeTooltip>

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

        {/* ── Vynta inline chat ── */}
        <UpgradeTooltip locked={!canAccess(plan, "aiConsultant")} requiredPlan="Pro">
          <div style={{ borderRadius: "16px", overflow: "hidden", height: "500px", display: "flex", flexDirection: "column", background: "#120804", boxShadow: "0 2px 20px rgba(0,0,0,0.35)" }}>

            {/* Header */}
            <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(45,155,138,0.15)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "linear-gradient(135deg, #2D9B8A 0%, #1a6b5e 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg viewBox="0 0 20 20" fill="none" style={{ width: "16px", height: "16px" }}>
                    <path d="M2 12 C4 8, 6 14, 8 10 S12 6, 14 10 S17 14, 18 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "#2D9B8A", textTransform: "uppercase" }}>VYNTA</span>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2D9B8A", display: "inline-block", boxShadow: "0 0 0 2px rgba(45,155,138,0.25)", animation: "pulse 2s infinite" }} />
                  </div>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", margin: 0, marginTop: "1px" }}>Reputation strategist · Always on</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", scrollbarWidth: "thin", scrollbarColor: "rgba(45,155,138,0.2) transparent" }}>
              {messages.length === 0 && !loading && (
                <div style={{ margin: "auto 0" }}>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", lineHeight: 1.6, textAlign: "center" }}>
                    Ask anything about your goals<br />or reputation strategy.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <span style={{ fontSize: "9px", fontWeight: 600, color: m.role === "user" ? "rgba(45,155,138,0.7)" : "rgba(255,255,255,0.28)", marginBottom: "3px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {m.role === "user" ? "You" : "Vynta"}
                  </span>
                  <div style={{
                    maxWidth: "90%", borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                    padding: "9px 13px", fontSize: "13px", lineHeight: 1.6,
                    background: m.role === "user" ? "linear-gradient(135deg, #2D9B8A, #1e7a6c)" : "rgba(255,255,255,0.07)",
                    color: m.role === "user" ? "white" : "rgba(255,255,255,0.88)",
                    border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}>
                    {m.role === "user" ? m.content : <MarkdownContent>{m.content}</MarkdownContent>}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.28)", marginBottom: "3px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Vynta</span>
                  <div style={{ borderRadius: "14px 14px 14px 3px", padding: "10px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "5px", alignItems: "center" }}>
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="animate-bounce" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2D9B8A", display: "inline-block", animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop: "1px solid rgba(45,155,138,0.12)", padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center", background: "rgba(0,0,0,0.25)", flexShrink: 0 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask me anything..."
                disabled={loading}
                style={{ flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: "10px", border: "1px solid rgba(45,155,138,0.2)", padding: "9px 13px", fontSize: "13px", color: "rgba(255,255,255,0.9)", outline: "none" }}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                aria-label="Send"
                style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#2D9B8A", border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer", opacity: !input.trim() || loading ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 150ms" }}
              >
                <svg viewBox="0 0 16 16" fill="white" style={{ width: "13px", height: "13px" }}>
                  <path d="M2.75 3.587A1 1 0 0 1 3.917 2.5l9.666 4.833a1 1 0 0 1 0 1.334L3.917 13.5A1 1 0 0 1 2.75 12.413V9.25l5.5-1.25-5.5-1.25V3.587Z" />
                </svg>
              </button>
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} } input[placeholder="Ask me anything..."]::placeholder{color:rgba(255,255,255,0.22)!important}`}</style>
          </div>
        </UpgradeTooltip>

      </div>
    </div>
  );
}
