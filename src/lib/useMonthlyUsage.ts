"use client";

import { useState, useEffect } from "react";

const AI_RESPONSE_LIMITS: Record<string, number | null> = {
  starter: 20,
  professional: 100,
  agency: null,
};

const FREE_LIMIT = 5;

function getMonthKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `vynta_usage_${yyyy}_${mm}`;
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getMonthKey());
      setCount(raw ? parseInt(raw, 10) || 0 : 0);
    } catch {}
  }, []);

  function increment() {
    try {
      const key = getMonthKey();
      const raw = localStorage.getItem(key);
      const next = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
      localStorage.setItem(key, String(next));
      setCount(next);
    } catch {}
  }

  const atLimit = limit !== null && count >= limit;

  return { count, limit, increment, atLimit };
}
