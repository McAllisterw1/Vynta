"use client";

import { useState, useEffect } from "react";

export type HistoryEntry = {
  id: string;
  businessName: string;
  reviewerName: string;
  rating: number;
  comment: string;
  response: string;
  tone?: string | null;
  createdAt: string;
};

export function useResponseHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch("/api/user/response-history")
      .then((res) => res.json())
      .then((data: HistoryEntry[]) => setHistory(data))
      .catch(() => {});
  }, []);

  async function addEntry(entry: Omit<HistoryEntry, "id" | "createdAt">) {
    try {
      const res = await fetch("/api/user/response-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const created = await res.json() as HistoryEntry;
      setHistory((prev) => [created, ...prev].slice(0, 100));
    } catch {}
  }

  async function clearHistory() {
    try {
      await fetch("/api/user/response-history", { method: "DELETE" });
      setHistory([]);
    } catch {}
  }

  return { history, addEntry, clearHistory };
}
