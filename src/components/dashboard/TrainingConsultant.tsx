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

const MODULE_NAMES = [
  "Why Reviews Are Money",
  "How Google Decides Who Shows Up",
  "The Right Way to Ask",
  "Your 30-Day Playbook",
  "How to Beat the Algorithm",
  "Customer Psychology & Reviews",
  "How Trust Is Built Online",
];

async function buildSystemPrompt(): Promise<string> {
  const [settingsRes, reviewsRes, trainingRes, competitorsRes] = await Promise.allSettled([
    fetch("/api/user/settings"),
    fetch("/api/user/reviews"),
    fetch("/api/user/training"),
    fetch("/api/user/competitors"),
  ]);

  let businessName = "this business";
  let totalReviews = 0;
  let avgRating: number | null = null;
  let completedModules: string[] = [];
  let competitorText = "none added yet";

  if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
    const s = await settingsRes.value.json() as { businessName?: string | null };
    businessName = s.businessName || "this business";
  }

  if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
    const reviews = await reviewsRes.value.json() as Array<{ rating: number }>;
    totalReviews = reviews.length;
    if (reviews.length > 0) {
      avgRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
    }
  }

  if (trainingRes.status === "fulfilled" && trainingRes.value.ok) {
    const t = await trainingRes.value.json() as { completed?: boolean[] } | null;
    if (t?.completed) {
      completedModules = t.completed
        .map((done, i) => (done ? MODULE_NAMES[i] : null))
        .filter((n): n is string => n !== null);
    }
  }

  if (competitorsRes.status === "fulfilled" && competitorsRes.value.ok) {
    const comps = await competitorsRes.value.json() as Array<{ name: string; rating: number; reviewCount: number }>;
    if (comps.length > 0) {
      competitorText = comps.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ");
    }
  }

  const statsLine = avgRating !== null
    ? `${totalReviews} reviews, ${avgRating} star average`
    : `${totalReviews} reviews logged`;

  const trainingLine = completedModules.length > 0
    ? completedModules.join(", ")
    : "none yet";

  return `You are Vynta — a sharp, straight-talking reputation strategist who has helped hundreds of local businesses dominate their Google rankings. You are working with ${businessName} right now.

You know the local service business game cold. You give direct, specific advice — no hedging, no filler. When there's an easy win, you point to it immediately. When something isn't working, you say so plainly and tell them what to do instead. You have a confident edge but you're rooting for them.

Business stats: ${statsLine}.
Training completed: ${trainingLine}.
Competitors: ${competitorText}.

Keep responses tight — 2-4 sentences unless a step-by-step answer genuinely needs more. Never start a response with "Great question" or any filler opener. Get straight to the point.`;
}

export default function TrainingConsultant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    buildSystemPrompt().then(setSystemPrompt).catch(() => {});
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#120804",
    }}>
      {/* Coach header */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid rgba(45,155,138,0.15)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          {/* Wave logo mark */}
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "linear-gradient(135deg, #2D9B8A 0%, #1a6b5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: "18px", height: "18px" }}>
              <path d="M2 12 C4 8, 6 14, 8 10 S12 6, 14 10 S17 14, 18 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
                color: "#2D9B8A", textTransform: "uppercase",
              }}>
                VYNTA COACH
              </span>
              {/* Live dot */}
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#2D9B8A", display: "inline-block",
                boxShadow: "0 0 0 2px rgba(45,155,138,0.25)",
                animation: "pulse 2s infinite",
              }} />
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0, marginTop: "1px" }}>
              Reputation strategist · Always on
            </p>
          </div>
        </div>
      </div>

      {/* Message area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(45,155,138,0.2) transparent",
      }}>
        {messages.length === 0 && !loading && (
          <div style={{ margin: "auto 0", paddingTop: "16px" }}>
            <p style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.6,
              textAlign: "center",
            }}>
              Ask anything about your reputation —<br />strategy, reviews, responses, timing.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}
          >
            <span style={{
              fontSize: "10px", fontWeight: 600,
              color: m.role === "user" ? "rgba(45,155,138,0.7)" : "rgba(255,255,255,0.3)",
              marginBottom: "4px", letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              {m.role === "user" ? "You" : "Vynta"}
            </span>
            <div style={{
              maxWidth: "90%",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px",
              fontSize: "13px",
              lineHeight: 1.65,
              background: m.role === "user"
                ? "linear-gradient(135deg, #2D9B8A, #1e7a6c)"
                : "rgba(255,255,255,0.07)",
              color: m.role === "user" ? "white" : "rgba(255,255,255,0.88)",
              border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}>
              {m.role === "user" ? m.content : <MarkdownContent>{m.content}</MarkdownContent>}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{
              fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.3)",
              marginBottom: "4px", letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Vynta
            </span>
            <div style={{
              borderRadius: "16px 16px 16px 4px",
              padding: "12px 16px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: "5px",
              alignItems: "center",
            }}>
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="animate-bounce"
                  style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#2D9B8A", display: "inline-block",
                    animationDelay: `${d}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {showSuggestions && (
        <div style={{
          padding: "0 16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          flexShrink: 0,
        }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              style={{
                background: "rgba(45,155,138,0.08)",
                color: "rgba(45,155,138,0.9)",
                border: "1px solid rgba(45,155,138,0.2)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 150ms",
                lineHeight: 1.4,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        borderTop: "1px solid rgba(45,155,138,0.12)",
        padding: "12px 14px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        background: "rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={loading}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.07)",
            borderRadius: "12px",
            border: "1px solid rgba(45,155,138,0.2)",
            padding: "10px 14px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.9)",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          aria-label="Send"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "#2D9B8A",
            border: "none",
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
            opacity: !input.trim() || loading ? 0.35 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "opacity 150ms",
          }}
        >
          <svg viewBox="0 0 16 16" fill="white" style={{ width: "14px", height: "14px" }}>
            <path d="M2.75 3.587A1 1 0 0 1 3.917 2.5l9.666 4.833a1 1 0 0 1 0 1.334L3.917 13.5A1 1 0 0 1 2.75 12.413V9.25l5.5-1.25-5.5-1.25V3.587Z" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  );
}
