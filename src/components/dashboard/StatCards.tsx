"use client";

import { useState, useEffect } from "react";
import { useResponseHistory } from "@/lib/useResponseHistory";

const REQUESTS_KEY = "vynta_requests_sent";

export default function StatCards() {
  const { history } = useResponseHistory();
  const [requestsSent, setRequestsSent] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REQUESTS_KEY);
      if (stored) setRequestsSent(parseInt(stored, 10) || 0);
    } catch {}
  }, []);

  const now = new Date();
  const newReviews = history.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const unanswered = 0;

  const avgRating =
    history.length > 0
      ? (history.reduce((sum, e) => sum + e.rating, 0) / history.length).toFixed(1)
      : null;

  const stats = [
    {
      label: "New Reviews",
      value: String(newReviews),
      detail: newReviews === 1 ? "response generated this month" : "responses generated this month",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      ),
    },
    {
      label: "Unanswered Reviews",
      value: String(unanswered),
      detail: "all caught up",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      ),
    },
    {
      label: "Average Rating",
      value: avgRating ?? "—",
      detail: history.length > 0 ? `across ${history.length} review${history.length !== 1 ? "s" : ""}` : "no data yet",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
    {
      label: "Review Requests Sent",
      value: String(requestsSent),
      detail: requestsSent === 1 ? "request sent" : "requests sent",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-sm border border-cream-border bg-sand-pale p-6"
        >
          <div className="mb-4 inline-flex rounded-sm bg-cream p-2 text-teal border border-cream-border">
            {stat.icon}
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-tobacco-light mb-1">
            {stat.label}
          </p>
          <p className="font-display text-4xl font-bold text-tobacco leading-none mb-1">
            {stat.value}
          </p>
          <p className="text-xs text-tobacco-light">{stat.detail}</p>
        </div>
      ))}
    </div>
  );
}
