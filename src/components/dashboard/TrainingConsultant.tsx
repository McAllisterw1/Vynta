"use client";

import { useState, useEffect, useRef } from "react";
import MarkdownContent from "@/components/ui/MarkdownContent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do I ask for reviews without being awkward?",
  "What should I do first this week to get more reviews?",
  "How do I respond to a bad review professionally?",
];

function buildSystemPrompt(): string {
  let businessName = "this business";
  let totalReviews = 0;
  let avgRating: number | null = null;
  let completedModules: string[] = [];
  let competitorText = "none added yet";

  const MODULE_NAMES = [
    "Why Reviews Are Money",
    "How Google Decides Who Shows Up",
    "The Right Way to Ask",
    "Your 30 Day Playbook",
    "How to Beat the Algorithm",
  ];

  try {
    businessName = localStorage.getItem("vynta_default_business") || "this business";
  } catch {}

  try {
    const stats = JSON.parse(localStorage.getItem("vynta_stats") || "null") as { totalReviews?: number; avgRating?: number | null } | null;
    if (stats) {
      totalReviews = stats.totalReviews ?? 0;
      avgRating = stats.avgRating ?? null;
    }
  } catch {}

  try {
    const training = JSON.parse(localStorage.getItem("vynta_training") || "null") as { completed?: boolean[] } | null;
    if (training?.completed) {
      completedModules = training.completed
        .map((done, i) => (done ? MODULE_NAMES[i] : null))
        .filter((n): n is string => n !== null);
    }
  } catch {}

  try {
    const comps = JSON.parse(localStorage.getItem("vynta_competitors") || "[]") as Array<{ name: string; rating: number; reviewCount: number }>;
    if (comps.length > 0) {
      competitorText = comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ");
    }
  } catch {}

  const statsLine = avgRating !== null
    ? `${totalReviews} reviews, ${avgRating} star average`
    : `${totalReviews} reviews logged`;

  const trainingLine = completedModules.length > 0
    ? completedModules.join(", ")
    : "none yet";

  return `You are an expert reputation management consultant for local service businesses. You are helping ${businessName} grow their Google reviews and beat their competition.

Business stats: ${statsLine}.
Training completed: ${trainingLine}.
Competitors: ${competitorText}.

Give specific, actionable advice. Be direct and confident. Keep responses concise — 2-4 sentences max unless a longer answer is truly needed. You are a trusted advisor, not a chatbot.`;
}

export default function TrainingConsultant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSystemPrompt(buildSystemPrompt());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, messages: updated }),
      });
      const data = await res.json() as { response?: string };
      setMessages([...updated, { role: "assistant", content: data.response ?? "Sorry, I couldn't generate a response. Please try again." }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Couldn't connect. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const showSuggestions = messages.length === 0;

  return (
    <div style={{ marginTop: "40px" }}>
      {/* Section heading */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "22px", lineHeight: 1 }}>✨</span>
          <h2
            className="font-display"
            style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C1A0E", margin: 0 }}
          >
            Vynta, Your AI Business Consultant
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.5, paddingLeft: "32px" }}>
          Ask anything about growing your reputation, getting more reviews, or beating your competition.
        </p>
      </div>

      {/* Chat card */}
      <div
        style={{
          background: "#E8DCC8",
          borderRadius: "20px",
          boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Message area */}
        <div
          style={{
            minHeight: "300px",
            maxHeight: "400px",
            overflowY: "auto",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.length === 0 && !loading && (
            <div style={{ margin: "auto", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#A0856A" }}>
                Ask a question to get started.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}
            >
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#A0856A", marginBottom: "4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {m.role === "user" ? "You" : "Vynta AI"}
              </span>
              <div
                style={{
                  maxWidth: "85%",
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "11px 15px",
                  fontSize: "13px",
                  lineHeight: 1.65,
                  background: m.role === "user" ? "#2D9B8A" : "#FAF5E8",
                  color: m.role === "user" ? "white" : "#2C1A0E",
                  boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
                }}
              >
                {m.role === "user" ? m.content : <MarkdownContent>{m.content}</MarkdownContent>}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#A0856A", marginBottom: "4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Vynta AI
              </span>
              <div
                style={{
                  borderRadius: "18px 18px 18px 4px",
                  padding: "11px 18px",
                  background: "#FAF5E8",
                  boxShadow: "0 1px 4px rgba(44,26,14,0.08)",
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                }}
              >
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="animate-bounce"
                    style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      background: "#A0856A", display: "inline-block",
                      animationDelay: `${d}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={loading}
                style={{
                  background: "rgba(45,155,138,0.1)",
                  color: "#2D9B8A",
                  border: "1px solid rgba(45,155,138,0.25)",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 150ms",
                  textAlign: "left",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div
          style={{
            borderTop: "1px solid rgba(44,26,14,0.08)",
            padding: "12px 14px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            background: "#E8DCC8",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your reputation..."
            disabled={loading}
            style={{
              flex: 1,
              background: "white",
              borderRadius: "99px",
              border: "none",
              boxShadow: "0 1px 4px rgba(44,26,14,0.1)",
              padding: "11px 18px",
              fontSize: "13px",
              color: "#2C1A0E",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            aria-label="Send"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#2D9B8A",
              border: "none",
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              opacity: !input.trim() || loading ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "opacity 150ms",
            }}
          >
            <svg viewBox="0 0 16 16" fill="white" style={{ width: "15px", height: "15px" }}>
              <path d="M2.75 3.587A1 1 0 0 1 3.917 2.5l9.666 4.833a1 1 0 0 1 0 1.334L3.917 13.5A1 1 0 0 1 2.75 12.413V9.25l5.5-1.25-5.5-1.25V3.587Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
