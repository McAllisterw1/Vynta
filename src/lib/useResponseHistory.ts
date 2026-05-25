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

// Module-level cache shared across all hook instances
let cache: { data: HistoryEntry[]; ts: number } | null = null;
let inflight: Promise<HistoryEntry[]> | null = null;
const TTL = 60_000;

function fetchHistory(): Promise<HistoryEntry[]> {
  if (cache && Date.now() - cache.ts < TTL) return Promise.resolve(cache.data);
  if (inflight) return inflight;
  inflight = fetch("/api/user/response-history")
    .then((r) => r.json() as Promise<HistoryEntry[]>)
    .then((data) => {
      cache = { data, ts: Date.now() };
      inflight = null;
      return data;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

export function useResponseHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(cache?.data ?? []);

  useEffect(() => {
    fetchHistory().then(setHistory).catch(() => {});
  }, []);

  async function addEntry(entry: Omit<HistoryEntry, "id" | "createdAt">) {
    try {
      const res = await fetch("/api/user/response-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const created = await res.json() as HistoryEntry;
      const updated = [created, ...(cache?.data ?? [])].slice(0, 100);
      cache = { data: updated, ts: Date.now() };
      setHistory(updated);
    } catch {}
  }

  async function clearHistory() {
    try {
      await fetch("/api/user/response-history", { method: "DELETE" });
      cache = { data: [], ts: Date.now() };
      setHistory([]);
    } catch {}
  }

  return { history, addEntry, clearHistory };
}
