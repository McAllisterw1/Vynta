"use client";

import { useState, useEffect } from "react";
import { canAccess } from "@/lib/plans";
import UpgradeTooltip from "@/components/ui/UpgradeTooltip";

const REVIEWS_KEY = "vynta_our_reviews";
const STATS_KEY = "vynta_stats";

type Platform = "Google" | "Yelp" | "Facebook" | "Other";

interface LoggedReview {
  id: string;
  reviewerName: string;
  platform: Platform;
  rating: number;
  text: string;
  date: string;
  responded: boolean;
  seen: boolean;
}

const PLATFORM_COLORS: Record<Platform, { bg: string; text: string }> = {
  Google:   { bg: "#4285F4", text: "white" },
  Yelp:     { bg: "#D32323", text: "white" },
  Facebook: { bg: "#1877F2", text: "white" },
  Other:    { bg: "#7B5E45", text: "white" },
};

const CARD: React.CSSProperties = {
  background: "#E8DCC8",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
};

const MODAL_LABEL: React.CSSProperties = {
  fontSize: "9px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#A0856A",
  display: "block",
  marginBottom: "5px",
  fontWeight: 600,
};

const MODAL_INPUT: React.CSSProperties = {
  background: "white",
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 1px 3px rgba(44,26,14,0.08)",
  padding: "9px 12px",
  fontSize: "13px",
  color: "#2C1A0E",
  width: "100%",
  outline: "none",
  marginBottom: "12px",
  display: "block",
  boxSizing: "border-box" as const,
};

function Stars({
  rating,
  interactive,
  onSelect,
  size = 14,
}: {
  rating: number;
  interactive?: boolean;
  onSelect?: (n: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const active = interactive ? s <= (hovered ?? rating) : s <= rating;
        const color = interactive
          ? active ? "#F5A623" : "#A0856A"
          : active ? "#C4874A" : "#C8B49A";

        const star = (
          <svg
            key={s}
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ width: size, height: size, color, display: "block" }}
          >
            <path d="M7.657 1.077a.4.4 0 0 1 .686 0l1.832 3.436 3.889.521a.4.4 0 0 1 .224.69L11.64 8.4l.656 3.796a.4.4 0 0 1-.587.418L8 10.863l-3.71 1.75a.4.4 0 0 1-.586-.418l.656-3.796L1.712 5.724a.4.4 0 0 1 .224-.69l3.89-.521 1.831-3.436Z" />
          </svg>
        );
        if (interactive) {
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect?.(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", lineHeight: 0 }}
            >
              {star}
            </button>
          );
        }
        return star;
      })}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function syncStats(reviews: LoggedReview[]) {
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : null;
  try {
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({ totalReviews: total, avgRating: avg !== null ? parseFloat(avg.toFixed(1)) : null })
    );
  } catch {}
}

function blankForm() {
  return {
    reviewerName: "",
    platform: "Google" as Platform,
    rating: 0,
    text: "",
    date: new Date().toISOString().slice(0, 10),
    responded: false,
  };
}

export default function OurReviewsScreen({ plan }: { plan?: string | null }) {
  const [reviews, setReviews] = useState<LoggedReview[]>([]);
  const [activeTab, setActiveTab] = useState<"new" | "seen">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [generatingReplyId, setGeneratingReplyId] = useState<string | null>(null);
  const [generatedReplies, setGeneratedReplies] = useState<Record<string, string>>({});
  const [replyCopied, setReplyCopied] = useState<Record<string, boolean>>({});

  // Recovery mode
  const [recoveryReview, setRecoveryReview] = useState<LoggedReview | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    public_response: string;
    private_message: string;
    recovery_checklist: string[];
  } | null>(null);
  const [recoveryCopied, setRecoveryCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Omit<LoggedReview, "seen"> & { seen?: boolean }>;
        setReviews(parsed.map((r) => ({ ...r, seen: r.seen ?? false })));
      }
    } catch {}
  }, []);

  function persist(next: LoggedReview[]) {
    setReviews(next);
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(next)); } catch {}
    syncStats(next);
  }

  function toggleSeen(id: string) {
    persist(reviews.map((r) => r.id === id ? { ...r, seen: !r.seen } : r));
  }

  function saveReview() {
    if (!form.reviewerName.trim() || form.rating === 0) return;
    if (editingId) {
      persist(
        reviews.map((r) =>
          r.id === editingId
            ? {
                ...r,
                reviewerName: form.reviewerName.trim(),
                platform: form.platform,
                rating: form.rating,
                text: form.text.trim(),
                date: form.date || r.date,
                responded: form.responded,
              }
            : r
        )
      );
    } else {
      persist([{
        id: crypto.randomUUID(),
        reviewerName: form.reviewerName.trim(),
        platform: form.platform,
        rating: form.rating,
        text: form.text.trim(),
        date: form.date || new Date().toISOString().slice(0, 10),
        responded: form.responded,
        seen: false,
      }, ...reviews]);
    }
    closeModal();
  }

  function openEdit(review: LoggedReview) {
    setForm({
      reviewerName: review.reviewerName,
      platform: review.platform,
      rating: review.rating,
      text: review.text,
      date: review.date,
      responded: review.responded,
    });
    setEditingId(review.id);
    setShowModal(true);
  }

  function deleteReview(id: string) {
    persist(reviews.filter((r) => r.id !== id));
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(blankForm());
  }

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function generateReply(review: LoggedReview) {
    if (generatingReplyId) return;
    setGeneratingReplyId(review.id);
    let businessName = "";
    try { businessName = localStorage.getItem("vynta_default_business") ?? ""; } catch {}
    const system = "You are a professional reputation manager. Write a short, warm, professional reply to this customer review on behalf of the business. Keep it under 100 words. Sound human, not corporate.";
    const msg = `Reviewer: ${review.reviewerName}\nRating: ${review.rating} stars\nBusiness: ${businessName || "the business"}\nReview: "${review.text}"`;
    try {
      const res = await fetch("/api/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
      });
      const data = await res.json() as { response?: string };
      const reply = data.response?.trim() ?? "";
      if (reply) setGeneratedReplies((prev) => ({ ...prev, [review.id]: reply }));
    } catch {
      showToastMsg("Couldn't generate a reply. Please try again.");
    } finally {
      setGeneratingReplyId(null);
    }
  }

  function copyGeneratedReply(id: string) {
    const text = generatedReplies[id];
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setReplyCopied((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setReplyCopied((prev) => ({ ...prev, [id]: false })), 2000);
  }

  function openRecoveryMode(review: LoggedReview) {
    setRecoveryReview(review);
    setRecoveryData(null);
    setRecoveryLoading(true);
    let businessName = "";
    try { businessName = localStorage.getItem("vynta_default_business") ?? ""; } catch {}
    const system = `You are a reputation recovery coach. Based on a negative review, generate a JSON response with exactly three keys:
- public_response: a calm, professional, empathetic public reply to post on Google (2-3 sentences)
- private_message: a short direct follow-up message to send the customer privately (1-2 sentences, offer to make it right)
- recovery_checklist: an array of exactly 3 short strings, each a concrete internal action to take

Return only valid JSON with no markdown, no code fences, no explanation.`;
    const msg = `Reviewer: ${review.reviewerName}\nRating: ${review.rating} stars\nReview: "${review.text}"\n${businessName ? `Business: ${businessName}` : ""}`;
    fetch("/api/consultant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: msg }] }),
    })
      .then((res) => res.json())
      .then((data: { response?: string }) => {
        const raw = (data.response ?? "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        setRecoveryData(JSON.parse(raw) as typeof recoveryData);
      })
      .catch(() => setRecoveryData(null))
      .finally(() => setRecoveryLoading(false));
  }

  function closeRecoveryModal() {
    setRecoveryReview(null);
    setRecoveryData(null);
    setRecoveryCopied({});
  }

  function copyRecovery(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setRecoveryCopied((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setRecoveryCopied((prev) => ({ ...prev, [key]: false })), 2000);
  }

  // Derived counts + filtered list
  const newCount  = reviews.filter((r) => !r.seen).length;
  const seenCount = reviews.filter((r) => r.seen).length;

  const filtered = reviews
    .filter((r) => (activeTab === "new" ? !r.seen : r.seen))
    .filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        r.reviewerName.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        formatDate(r.date).toLowerCase().includes(q)
      );
    });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const respondedCount = reviews.filter((r) => r.responded).length;
  const canSave = form.reviewerName.trim().length > 0 && form.rating > 0;

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)",
          background: "#2C1A0E", color: "white", padding: "10px 20px", borderRadius: "99px",
          fontSize: "13px", fontWeight: 500, zIndex: 10000, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(44,26,14,0.3)", maxWidth: "90vw", textAlign: "center",
        }}>
          {toast}
        </div>
      )}

      {/* ── Log / Edit modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(44,26,14,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px 20px 120px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: "#E8DCC8", borderRadius: "20px", width: "340px",
            boxShadow: "0 8px 40px rgba(44,26,14,0.22), 0 2px 8px rgba(44,26,14,0.1)",
            padding: "18px 18px 16px", position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h3 className="font-display" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E", margin: 0 }}>
                {editingId ? "Edit Review" : "Log a Review"}
              </h3>
              <button type="button" onClick={closeModal} aria-label="Close"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#A0856A", padding: "2px", lineHeight: 0 }}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </div>

            <label style={MODAL_LABEL}>Reviewer Name</label>
            <input type="text" value={form.reviewerName} onChange={(e) => setForm((f) => ({ ...f, reviewerName: e.target.value }))}
              placeholder="e.g. Sarah M." style={MODAL_INPUT} />

            <label style={MODAL_LABEL}>Platform</label>
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {(["Google", "Yelp", "Facebook", "Other"] as Platform[]).map((p) => {
                const active = form.platform === p;
                const pc = PLATFORM_COLORS[p];
                return (
                  <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, platform: p }))}
                    style={{
                      flex: 1, padding: "7px 2px", borderRadius: "8px", border: "none",
                      fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      background: active ? pc.bg : "#E8DCC8", color: active ? pc.text : "#A0856A",
                      boxShadow: "0 1px 3px rgba(44,26,14,0.08)", transition: "background 150ms, color 150ms",
                    }}>
                    {p}
                  </button>
                );
              })}
            </div>

            <label style={MODAL_LABEL}>Rating</label>
            <div style={{ marginBottom: "12px" }}>
              <Stars rating={form.rating} interactive onSelect={(n) => setForm((f) => ({ ...f, rating: n }))} size={26} />
            </div>

            <label style={MODAL_LABEL}>Review Text</label>
            <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              rows={3} placeholder="Paste or type the review…" style={{ ...MODAL_INPUT, resize: "none" }} />

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "14px" }}>
              <div style={{ flex: 1 }}>
                <label style={MODAL_LABEL}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  style={{ ...MODAL_INPUT, marginBottom: 0 }} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <label style={MODAL_LABEL}>Responded?</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {([true, false] as const).map((val) => (
                    <button key={String(val)} type="button" onClick={() => setForm((f) => ({ ...f, responded: val }))}
                      style={{
                        padding: "6px 12px", borderRadius: "20px", border: "none",
                        fontSize: "11px", fontWeight: 600, cursor: "pointer",
                        background: form.responded === val ? (val ? "#2D9B8A" : "#C4874A") : "#E8DCC8",
                        color: form.responded === val ? "white" : "#A0856A",
                        boxShadow: "0 1px 3px rgba(44,26,14,0.08)", transition: "background 150ms, color 150ms",
                      }}>
                      {val ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={saveReview} disabled={!canSave}
                style={{
                  flex: 1, background: "#2C1A0E", color: "white", borderRadius: "10px",
                  padding: "11px", fontSize: "13px", fontWeight: 600, border: "none",
                  cursor: canSave ? "pointer" : "not-allowed", opacity: canSave ? 1 : 0.4,
                }}>
                Save Review
              </button>
              <button type="button" onClick={closeModal}
                style={{
                  background: "#E8DCC8", color: "#A0856A", borderRadius: "10px",
                  padding: "11px 16px", fontSize: "13px", fontWeight: 500, border: "none",
                  boxShadow: "0 1px 4px rgba(44,26,14,0.1)", cursor: "pointer",
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recovery Mode modal ── */}
      {recoveryReview && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999, background: "rgba(44,26,14,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeRecoveryModal(); }}
        >
          <div style={{
            background: "#FAF5E8", borderRadius: "20px", width: "360px", maxHeight: "88vh",
            overflowY: "auto", boxShadow: "0 8px 40px rgba(44,26,14,0.22)",
            padding: "20px 20px 24px", position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 className="font-display" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2C1A0E", margin: 0 }}>
                  🛡️ Review Recovery
                </h3>
                <p style={{ fontSize: "11px", color: "#A0856A", marginTop: "3px" }}>
                  {recoveryReview.rating}★ · {recoveryReview.reviewerName}
                </p>
              </div>
              <button type="button" onClick={closeRecoveryModal} aria-label="Close"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#A0856A", padding: "2px", lineHeight: 0 }}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </div>

            {recoveryLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px 0" }}>
                <div style={{ display: "flex", gap: "5px" }}>
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="animate-bounce" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#A0856A", display: "inline-block", animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <p style={{ fontSize: "12px", color: "#A0856A" }}>Building your recovery plan…</p>
              </div>
            ) : recoveryData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "#E8DCC8", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "8px" }}>Public Reply</p>
                  <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.6, marginBottom: "10px" }}>{recoveryData.public_response}</p>
                  <button type="button" onClick={() => copyRecovery("public", recoveryData!.public_response)}
                    style={{ background: "#2D9B8A", color: "white", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                    {recoveryCopied.public ? "Copied!" : "Copy Reply"}
                  </button>
                </div>
                <div style={{ background: "#E8DCC8", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "8px" }}>Private Follow-Up</p>
                  <p style={{ fontSize: "13px", color: "#2C1A0E", lineHeight: 1.6, marginBottom: "10px" }}>{recoveryData.private_message}</p>
                  <button type="button" onClick={() => copyRecovery("private", recoveryData!.private_message)}
                    style={{ background: "#2D9B8A", color: "white", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                    {recoveryCopied.private ? "Copied!" : "Copy Message"}
                  </button>
                </div>
                <div style={{ background: "#E8DCC8", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0856A", fontWeight: 600, marginBottom: "10px" }}>Action Checklist</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                    {recoveryData.recovery_checklist.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#C4874A", color: "white", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                          {i + 1}
                        </span>
                        <p style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.5, margin: 0 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => copyRecovery("checklist", recoveryData!.recovery_checklist.map((item, i) => `${i + 1}. ${item}`).join("\n"))}
                    style={{ background: "#2D9B8A", color: "white", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                    {recoveryCopied.checklist ? "Copied!" : "Copy Checklist"}
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "#A0856A", textAlign: "center", padding: "24px 0" }}>
                Couldn&apos;t generate a recovery plan. Please try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ padding: "28px 24px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C1A0E", lineHeight: 1.1 }}>
              Our Reviews
            </h1>
            <p style={{ fontSize: "13px", color: "#A0856A", marginTop: "5px" }}>
              {reviews.length > 0
                ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""} · ${avgRating} avg · ${respondedCount} responded`
                : "Log your customer reviews to track your reputation."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              background: "#2C1A0E", color: "white", borderRadius: "20px",
              padding: "9px 16px", fontSize: "13px", fontWeight: 600,
              border: "none", cursor: "pointer", flexShrink: 0, marginTop: "4px", whiteSpace: "nowrap",
            }}
          >
            + Log Review
          </button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: "0 24px 12px" }}>
        <div style={{ position: "relative" }}>
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "#A0856A", pointerEvents: "none" }}>
            <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, date, or review text…"
            style={{
              width: "100%",
              background: "#E8DCC8",
              borderRadius: "10px",
              border: "none",
              padding: "10px 14px 10px 34px",
              fontSize: "13px",
              color: "#2C1A0E",
              outline: "none",
              boxSizing: "border-box" as const,
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A0856A", padding: "2px", lineHeight: 0 }}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "12px", height: "12px" }}>
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "2px solid rgba(44,26,14,0.06)", padding: "0 24px", gap: "4px", marginBottom: "4px" }}>
        {(["new", "seen"] as const).map((t) => {
          const active = activeTab === t;
          const count = t === "new" ? newCount : seenCount;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              style={{
                padding: "10px 16px 8px",
                fontSize: "12px",
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.04em",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: `3px solid ${active ? "#2C1A0E" : "transparent"}`,
                color: active ? "#2C1A0E" : "#A0856A",
                marginBottom: "-2px",
                transition: "color 150ms, border-color 150ms",
              }}
            >
              {t === "new" ? "New" : "Seen"}
              {count > 0 && (
                <span style={{
                  marginLeft: "6px",
                  background: active ? "#2C1A0E" : "rgba(44,26,14,0.1)",
                  color: active ? "white" : "#A0856A",
                  borderRadius: "99px",
                  padding: "1px 7px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Review list ── */}
      <div style={{ padding: "10px 24px 120px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.length === 0 ? (
          <div style={{ ...CARD, padding: "48px 24px", textAlign: "center", marginTop: "8px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>
              {searchQuery ? "🔍" : activeTab === "new" ? "⭐" : "✓"}
            </div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>
              {searchQuery
                ? "No reviews match your search"
                : activeTab === "new"
                ? "No new reviews"
                : "No seen reviews yet"}
            </p>
            <p style={{ fontSize: "13px", color: "#A0856A", lineHeight: 1.6 }}>
              {searchQuery
                ? "Try a different name or keyword."
                : activeTab === "new"
                ? "Hit \"+ Log Review\" to add your first one."
                : "Check a review's box to move it here."}
            </p>
          </div>
        ) : (
          filtered.map((review) => {
            const isExpanded = expandedId === review.id;
            const pc = PLATFORM_COLORS[review.platform];
            const longText = review.text.length > 120;

            return (
              <div key={review.id} style={{ ...CARD, overflow: "hidden" }}>
                <div style={{ padding: "14px 14px 13px" }}>

                  {/* Row 1: avatar · name/stars/date · seen checkbox · delete */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "11px" }}>

                    {/* Avatar */}
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: "#2C1A0E", display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                    }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>
                        {review.reviewerName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name + platform + stars + date */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap", marginBottom: "5px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#2C1A0E" }}>
                          {review.reviewerName}
                        </span>
                        <span style={{
                          background: pc.bg, color: pc.text,
                          borderRadius: "6px", padding: "2px 8px",
                          fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0,
                        }}>
                          {review.platform}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Stars rating={review.rating} size={13} />
                        <span style={{ fontSize: "10px", color: "#A0856A" }}>{formatDate(review.date)}</span>
                      </div>
                    </div>

                    {/* Seen checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSeen(review.id)}
                      title={review.seen ? "Mark as new" : "Mark as seen"}
                      style={{
                        width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${review.seen ? "#2D9B8A" : "rgba(44,26,14,0.2)"}`,
                        background: review.seen ? "#2D9B8A" : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 150ms", padding: 0,
                      }}
                    >
                      {review.seen && (
                        <svg viewBox="0 0 16 16" fill="white" style={{ width: "10px", height: "10px" }}>
                          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                        </svg>
                      )}
                    </button>

                    {/* Delete */}
                    <button type="button" onClick={() => deleteReview(review.id)} aria-label="Delete review"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#C4A882", flexShrink: 0, padding: "2px", lineHeight: 0 }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "14px", height: "14px" }}>
                        <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15H5.405a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z" />
                      </svg>
                    </button>
                  </div>

                  {/* Review text */}
                  {review.text && (
                    <div style={{ marginTop: "10px", paddingLeft: "51px" }}>
                      <p style={{
                        fontSize: "13px", lineHeight: 1.65, color: "#5C3A1E",
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: isExpanded ? 100 : 2, WebkitBoxOrient: "vertical",
                      } as React.CSSProperties}>
                        {review.text}
                      </p>
                      {longText && (
                        <button type="button" onClick={() => setExpandedId(isExpanded ? null : review.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#A0856A", padding: "3px 0", marginTop: "1px" }}>
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}

                      {/* Warning + recovery for low-star reviews */}
                      {review.rating <= 3 && (
                        <div style={{ marginTop: "6px" }}>
                          <p style={{
                            fontSize: "11px", color: "#B45309",
                            background: "rgba(180,83,9,0.08)", borderRadius: "6px",
                            padding: "4px 8px", lineHeight: 1.5, marginBottom: "6px",
                          }}>
                            ⚠️ This review may hurt conversions. Consider responding within 24 hours.
                          </p>
                          <UpgradeTooltip locked={!canAccess(plan, "recoveryMode")} requiredPlan="Pro">
                            <button type="button" onClick={() => openRecoveryMode(review)}
                              style={{ background: "#7B3F1A", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                              🛡️ Recovery Mode
                            </button>
                          </UpgradeTooltip>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generate Reply button */}
                  {review.text && (
                    <>
                      <div style={{ display: "flex", gap: "6px", marginTop: "10px", paddingLeft: "51px" }}>
                        <button type="button" onClick={() => generateReply(review)} disabled={generatingReplyId === review.id}
                          style={{
                            background: "#2D9B8A", color: "white", border: "none", borderRadius: "8px",
                            padding: "6px 11px", fontSize: "11px", fontWeight: 600,
                            cursor: generatingReplyId === review.id ? "not-allowed" : "pointer",
                            opacity: generatingReplyId === review.id ? 0.7 : 1,
                            display: "inline-flex", alignItems: "center", gap: "5px",
                          }}>
                          {generatingReplyId === review.id ? (
                            <>
                              <svg style={{ width: "11px", height: "11px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                              </svg>
                              Generating…
                            </>
                          ) : "⚡ Generate Reply"}
                        </button>
                      </div>

                      {generatedReplies[review.id] && (
                        <div style={{ paddingLeft: "51px", marginTop: "8px" }}>
                          <div style={{ background: "rgba(45,155,138,0.09)", borderRadius: "10px", padding: "10px 12px" }}>
                            <p style={{ fontSize: "12px", color: "#2C1A0E", lineHeight: 1.65, marginBottom: "8px" }}>
                              {generatedReplies[review.id]}
                            </p>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button type="button" onClick={() => copyGeneratedReply(review.id)}
                                style={{ background: "#2D9B8A", color: "white", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                {replyCopied[review.id] ? "Copied!" : "Copy Reply"}
                              </button>
                              <button type="button" onClick={() => generateReply(review)} disabled={generatingReplyId === review.id}
                                style={{
                                  background: "#E8DCC8", color: "#2C1A0E", border: "none", borderRadius: "6px",
                                  padding: "5px 12px", fontSize: "11px", fontWeight: 600,
                                  cursor: generatingReplyId === review.id ? "not-allowed" : "pointer",
                                  opacity: generatingReplyId === review.id ? 0.6 : 1,
                                  display: "inline-flex", alignItems: "center", gap: "4px",
                                }}>
                                {generatingReplyId === review.id ? (
                                  <>
                                    <svg style={{ width: "10px", height: "10px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                                    </svg>
                                    Regenerating…
                                  </>
                                ) : "↺ Regenerate"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Bottom row: responded badge | edit */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "11px", paddingLeft: "51px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      background: review.responded ? "rgba(45,155,138,0.12)" : "rgba(196,135,74,0.12)",
                      color: review.responded ? "#2D9B8A" : "#C4874A",
                      borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: 600,
                    }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor", display: "inline-block", flexShrink: 0 }} />
                      {review.responded ? "Responded" : "Not Responded"}
                    </span>
                    <button type="button" onClick={() => openEdit(review)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#A0856A", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "11px", height: "11px" }}>
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
                      </svg>
                      Edit
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
