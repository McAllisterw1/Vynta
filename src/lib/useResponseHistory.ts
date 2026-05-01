"use client";

import { useState, useEffect } from "react";

export type HistoryEntry = {
  id: string;
  businessName: string;
  reviewerName: string;
  rating: number;
  comment: string;
  response: string;
  createdAt: string;
};

const HISTORY_KEY = "vynta_response_history";

export function useResponseHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryEntry[]);
    } catch {}
  }, []);

  function addEntry(entry: Omit<HistoryEntry, "id" | "createdAt">) {
    const next: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => {
      const updated = [next, ...prev].slice(0, 100);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  }

  return { history, addEntry, clearHistory };
}
