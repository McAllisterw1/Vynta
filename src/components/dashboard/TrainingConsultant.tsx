"use client";

import { useState, useEffect, useRef } from "react";
import MarkdownContent from "@/components/ui/MarkdownContent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What are my biggest complaint themes right now?",
  "Where are my competitors weakest and how do I capitalize?",
  "What's my single most important action this week?",
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

interface SlimReview { rating: number; responded: boolean; date: string; }
interface FullReview { rating: number; date: string; text: string; reviewerName: string; responded: boolean; }
interface SentimentCache {
  data?: {
    positive?: number; neutral?: number; negative?: number; trending?: string;
    complaintThemes?: Array<{ theme: string; severity: string }>;
    praiseThemes?: string[];
    risks?: Array<{ description: string; severity: string }>;
    executiveSummary?: { improved?: string; declined?: string; biggestRisk?: string; biggestOpportunity?: string; recommendedAction?: string };
    operationalRecommendations?: string[];
  };
}
interface CompetitorRaw {
  name: string; rating: number; reviewCount: number;
  analysisText?: string | null; sentiment?: string | null;
  trend?: string | null; velocity?: string | null;
}

function lsReadIntel<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return (JSON.parse(raw) as { data: T }).data;
  } catch { return null; }
}

async function buildSystemPrompt(): Promise<string> {
  const [settingsRes, reviewsRes, slimRes, competitorsRes, sentimentRes, inboxRes] = await Promise.allSettled([
    fetch("/api/user/settings"),
    fetch("/api/user/reviews?limit=30"),
    fetch("/api/user/reviews?slim=true"),
    fetch("/api/user/competitors"),
    fetch("/api/user/sentiment-cache"),
    fetch("/api/user/smart-inbox"),
  ]);

  // ── Business settings ──────────────────────────────────────────────────────
  let businessName = "this business";
  let businessType = "local business";
  let googleRating: number | null = null;

  if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
    const s = await settingsRes.value.json() as { businessName?: string; businessType?: string; googleRating?: number };
    businessName = s.businessName || "this business";
    businessType  = s.businessType  || "local business";
    if (s.googleRating && s.googleRating > 0) googleRating = s.googleRating;
  }

  // ── Review stats (slim) ────────────────────────────────────────────────────
  let importedCount = 0;
  let avgImported: number | null = null;
  let unresponded = 0;
  let recentNeg = 0;

  if (slimRes.status === "fulfilled" && slimRes.value.ok) {
    const reviews = await slimRes.value.json() as SlimReview[];
    importedCount = reviews.length;
    if (reviews.length > 0) {
      avgImported = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
      unresponded  = reviews.filter(r => !r.responded).length;
      const cutoff = Date.now() - 30 * 86400000;
      recentNeg    = reviews.filter(r => r.rating <= 3 && new Date(r.date).getTime() >= cutoff).length;
    }
  }

  // ── Review text (30 most recent, for TLDR / breakdown requests) ───────────
  let reviewTextBlock = "(No reviews imported yet)";
  if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
    const reviews = await reviewsRes.value.json() as FullReview[];
    if (reviews.length > 0) {
      reviewTextBlock = reviews.map((r, i) => {
        const date = new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const snippet = (r.text ?? "").trim().slice(0, 220);
        const ellipsis = (r.text ?? "").length > 220 ? "…" : "";
        return `#${i + 1} · ${"★".repeat(r.rating)} · ${date} · ${r.reviewerName ?? "Anonymous"}${r.responded ? " [responded]" : ""}\n"${snippet}${ellipsis}"`;
      }).join("\n\n");
    }
  }

  // ── Smart Inbox total ──────────────────────────────────────────────────────
  let totalGoogleReviews: number | null = null;
  if (inboxRes.status === "fulfilled" && inboxRes.value.ok) {
    const inbox = await inboxRes.value.json() as { lastKnownCount?: number } | null;
    if (inbox?.lastKnownCount) totalGoogleReviews = inbox.lastKnownCount;
  }

  // ── Sentiment intelligence ─────────────────────────────────────────────────
  let sentimentBlock = "(No weekly sentiment analysis run yet — advise user to go to Reports tab and run one)";
  if (sentimentRes.status === "fulfilled" && sentimentRes.value.ok) {
    const raw = await sentimentRes.value.json() as SentimentCache | null;
    const d = raw?.data;
    if (d) {
      const complaints = d.complaintThemes?.map(t => `${t.theme} [${t.severity}]`).join(", ") || "none";
      const praise     = d.praiseThemes?.join(", ") || "none";
      const risks      = d.risks?.map(r => `${r.description} [${r.severity}]`).join("; ") || "none";
      const opRecs     = d.operationalRecommendations?.join("; ") || "none";
      const ex         = d.executiveSummary;
      sentimentBlock = [
        `Sentiment: ${d.positive ?? 0}% positive / ${d.neutral ?? 0}% neutral / ${d.negative ?? 0}% negative — trend: ${d.trending ?? "stable"}`,
        `Complaint themes: ${complaints}`,
        `Praise themes: ${praise}`,
        `Active risks: ${risks}`,
        `What improved: ${ex?.improved ?? "unknown"}`,
        `What declined: ${ex?.declined ?? "unknown"}`,
        `Biggest risk: ${ex?.biggestRisk ?? "none identified"}`,
        `Biggest opportunity: ${ex?.biggestOpportunity ?? "unknown"}`,
        `Recommended action: ${ex?.recommendedAction ?? "unknown"}`,
        `Operational recs: ${opRecs}`,
      ].join("\n");
    }
  }

  // ── Competitors ────────────────────────────────────────────────────────────
  let competitorBlock = "No competitors tracked yet — advise user to add rivals in the Rivals tab.";
  if (competitorsRes.status === "fulfilled" && competitorsRes.value.ok) {
    const comps = await competitorsRes.value.json() as CompetitorRaw[];
    if (comps.length > 0) {
      competitorBlock = comps.map(c => {
        const lines = [`${c.name} — ${c.rating}★, ${c.reviewCount.toLocaleString()} reviews, trend: ${c.trend ?? "unknown"}, velocity: ${c.velocity ?? "unknown"}`];
        try {
          const a = JSON.parse(c.analysisText ?? "{}") as { weaknesses?: string[]; strengths?: string[]; summary?: string };
          if (a.weaknesses?.length) lines.push(`  Weaknesses: ${a.weaknesses.join("; ")}`);
          if (a.strengths?.length)  lines.push(`  Strengths: ${a.strengths.join("; ")}`);
          if (a.summary)            lines.push(`  Summary: ${a.summary}`);
        } catch {}
        try {
          const s = JSON.parse(c.sentiment ?? "{}") as { positive?: number; negative?: number };
          if (s.positive != null) lines.push(`  Sentiment: ${s.positive}% positive, ${s.negative ?? 0}% negative`);
        } catch {}
        return lines.join("\n");
      }).join("\n\n");
    }
  }

  // ── Intel page outputs (from localStorage) ─────────────────────────────────
  const priorityActions = lsReadIntel<string[]>("vynta_priority_actions");
  const earlyWarnings   = lsReadIntel<{ warnings: Array<{ title: string; detail: string; action: string; severity: string; type: string }> }>("vynta_early_warnings");
  const threatAnalysis  = lsReadIntel<{ biggestThreat: string; beatingUser: string; userBeating: string; actions: string[] }>("vynta_threat_analysis");
  const marketIntel     = lsReadIntel<{ emergingThemes: string[]; opportunityGap: string; whatTopBusinessesDo: string }>("vynta_market_intelligence");
  const opportunities   = lsReadIntel<{ revenueOpportunities: Array<{ title: string; estimatedValue: string; detail: string; action: string }>; competitorGaps: Array<{ title: string; competitor: string; opportunity: string }>; quickWins: Array<{ action: string; why: string }> }>("vynta_opportunities");

  const intelParts: string[] = [];

  if (priorityActions?.length) {
    intelParts.push(`THIS WEEK'S PRIORITIES:\n${priorityActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`);
  }
  if (earlyWarnings?.warnings?.length) {
    intelParts.push(`EARLY WARNINGS:\n${earlyWarnings.warnings.map(w => `[${w.severity.toUpperCase()}] ${w.title}: ${w.detail} → ${w.action}`).join("\n")}`);
  }
  if (threatAnalysis) {
    intelParts.push([
      "THREAT ANALYSIS:",
      `Biggest threat: ${threatAnalysis.biggestThreat}`,
      `Where competitors beat you: ${threatAnalysis.beatingUser}`,
      `Where you win: ${threatAnalysis.userBeating}`,
      `Actions: ${threatAnalysis.actions?.join("; ")}`,
    ].join("\n"));
  }
  if (marketIntel) {
    intelParts.push([
      "MARKET INTELLIGENCE:",
      `Emerging themes: ${marketIntel.emergingThemes?.join(", ")}`,
      `Opportunity gap: ${marketIntel.opportunityGap}`,
      `What top businesses do: ${marketIntel.whatTopBusinessesDo}`,
    ].join("\n"));
  }
  if (opportunities) {
    const revOpp = opportunities.revenueOpportunities?.map(o => `• ${o.title} (${o.estimatedValue}): ${o.detail} → ${o.action}`).join("\n") ?? "";
    const gaps   = opportunities.competitorGaps?.map(g => `• ${g.competitor} — ${g.title}: ${g.opportunity}`).join("\n") ?? "";
    const wins   = opportunities.quickWins?.map(w => `• ${w.action}: ${w.why}`).join("\n") ?? "";
    const parts  = [];
    if (revOpp) parts.push(`Revenue opportunities:\n${revOpp}`);
    if (gaps)   parts.push(`Competitor gaps:\n${gaps}`);
    if (wins)   parts.push(`Quick wins:\n${wins}`);
    if (parts.length) intelParts.push(`OPPORTUNITIES:\n${parts.join("\n\n")}`);
  }

  const intelBlock = intelParts.length
    ? intelParts.join("\n\n")
    : "(Intel page not yet generated — advise user to visit the Intelligence tab first)";

  // ── Final prompt ───────────────────────────────────────────────────────────
  const ratingLine = googleRating != null
    ? `${googleRating}★ on Google`
    : avgImported != null
    ? `${avgImported}★ average (from imported reviews)`
    : "unknown";

  const reviewCountLine = totalGoogleReviews
    ? `${totalGoogleReviews.toLocaleString()} total on Google (${importedCount} imported into Vynta)`
    : `${importedCount} imported`;

  return `You are Vynta AI — a sharp, data-driven reputation strategist embedded inside the Vynta dashboard. You have live access to every piece of data this business has in Vynta. Every answer you give must be grounded in the real data below. Do not give generic advice when you have specific data to reference.

━━ BUSINESS PROFILE ━━
Name: ${businessName}
Type: ${businessType}
Rating: ${ratingLine}
Reviews: ${reviewCountLine}
Unresponded reviews: ${unresponded}
Low-rated reviews in last 30 days: ${recentNeg}

━━ SENTIMENT INTELLIGENCE (latest weekly analysis) ━━
${sentimentBlock}

━━ COMPETITORS ━━
${competitorBlock}

━━ RECENT REVIEWS — 30 most recent, actual customer words ━━
Use this section to answer TLDR requests, breakdowns by topic, specific review lookups, or questions about what customers are actually saying.
${reviewTextBlock}

━━ INTEL ANALYSIS — AI-generated outputs from Intelligence tab ━━
Use this section to give TLDRs of threat analysis, market intel, opportunities, early warnings, and weekly priorities.
${intelBlock}

━━ HOW TO RESPOND ━━
- Reference actual numbers, competitor names, complaint themes, and review quotes when answering
- For TLDR requests: summarize the relevant section concisely in 3-5 bullet points
- For breakdown requests: organize by theme or category with specific examples from the data
- Be direct and specific — no hedging, no filler
- Never open with "Great question" or any filler
- If asked about something not in the data above, say so clearly rather than guessing`;
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
        body: JSON.stringify({ system: systemPrompt, messages: updated, maxTokens: 2048 }),
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
