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

export function useMonthlyUsage(plan: string | null | undefined) {
  const [count, setCount] = useState(0);
  const limit = getResponseLimit(plan);
  const yearMonth = getCurrentYearMonth();

  useEffect(() => {
    fetch(`/api/user/usage?yearMonth=${yearMonth}`)
      .then((res) => res.json())
      .then((data: { count: number }) => setCount(data.count))
      .catch(() => {});
  }, [yearMonth]);

  async function increment() {
    try {
      const res = await fetch("/api/user/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth }),
      });
      const data = await res.json() as { count: number };
      setCount(data.count);
    } catch {}
  }

  const atLimit = limit !== null && count >= limit;

  return { count, limit, increment, atLimit };
}
