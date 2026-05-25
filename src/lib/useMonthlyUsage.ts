"use client";

import { useState, useEffect } from "react";

const AI_RESPONSE_LIMITS: Record<string, number | null> = {
  starter: 20,
  professional: 100,
  agency: null,
};

const FREE_LIMIT = 5;

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getResponseLimit(plan: string | null | undefined): number | null {
  if (!plan) return FREE_LIMIT;
  const limit = AI_RESPONSE_LIMITS[plan];
  if (limit === undefined) return FREE_LIMIT;
  return limit;
}

// Module-level cache keyed by yearMonth
const usageCache: Record<string, { count: number; ts: number }> = {};
const usageInflight: Record<string, Promise<number>> = {};
const TTL = 60_000;

function fetchUsage(yearMonth: string): Promise<number> {
  const cached = usageCache[yearMonth];
  if (cached && Date.now() - cached.ts < TTL) return Promise.resolve(cached.count);
  if (usageInflight[yearMonth]) return usageInflight[yearMonth];
  usageInflight[yearMonth] = fetch(`/api/user/usage?yearMonth=${yearMonth}`)
    .then((r) => r.json() as Promise<{ count: number }>)
    .then(({ count }) => {
      usageCache[yearMonth] = { count, ts: Date.now() };
      delete usageInflight[yearMonth];
      return count;
    })
    .catch((err) => {
      delete usageInflight[yearMonth];
      throw err;
    });
  return usageInflight[yearMonth];
}

export function useMonthlyUsage(plan: string | null | undefined) {
  const yearMonth = getCurrentYearMonth();
  const limit = getResponseLimit(plan);
  const [count, setCount] = useState(usageCache[yearMonth]?.count ?? 0);

  useEffect(() => {
    fetchUsage(yearMonth).then(setCount).catch(() => {});
  }, [yearMonth]);

  async function increment() {
    try {
      const res = await fetch("/api/user/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth }),
      });
      const data = await res.json() as { count: number };
      usageCache[yearMonth] = { count: data.count, ts: Date.now() };
      setCount(data.count);
    } catch {}
  }

  const atLimit = limit !== null && count >= limit;

  return { count, limit, increment, atLimit };
}
