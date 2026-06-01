import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic();

// ── Types ─────────────────────────────────────────────────────────────────────

interface ThemeEntry {
  theme: string;
  severity: "low" | "medium" | "high";
}

interface SentimentData {
  positive?: number;
  negative?: number;
  complaintThemes?: ThemeEntry[];
  topComplaints?: Array<{ name?: string; theme?: string; severity?: "low" | "medium" | "high" }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEV: Record<string, number> = { low: 1, medium: 2, high: 3 };

function extractThemes(data: SentimentData): ThemeEntry[] {
  if (data.complaintThemes?.length) {
    return data.complaintThemes.map(t => ({ theme: t.theme, severity: t.severity ?? "low" }));
  }
  if (data.topComplaints?.length) {
    return data.topComplaints.map(t => ({
      theme: t.name ?? t.theme ?? "Unknown",
      severity: t.severity ?? "low",
    }));
  }
  return [];
}

function avgField(records: SentimentData[], field: "positive" | "negative"): number {
  const vals = records.map(r => r[field] ?? 0);
  if (vals.length === 0) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.sentimentHistory.findMany({
    where: { userId },
    orderBy: { weekStart: "desc" },
    take: 8,
  });

  if (records.length < 2) {
    return NextResponse.json({ warnings: [], insufficient_data: true });
  }

  const recentRecs = records.slice(0, 2);
  const baselineRecs = records.slice(2);

  const recentData = recentRecs.map(r => r.data as SentimentData);
  const baselineData = baselineRecs.map(r => r.data as SentimentData);

  // Build theme maps: lowercase key → max severity
  const recentThemes = new Map<string, string>();
  const baselineThemes = new Map<string, string>();
  // Display name lookup
  const recentNames = new Map<string, string>();
  const baselineNames = new Map<string, string>();

  for (const rec of recentData) {
    for (const t of extractThemes(rec)) {
      const key = t.theme.toLowerCase();
      const cur = recentThemes.get(key);
      if (!cur || SEV[t.severity] > SEV[cur]) recentThemes.set(key, t.severity);
      if (!recentNames.has(key)) recentNames.set(key, t.theme);
    }
  }
  for (const rec of baselineData) {
    for (const t of extractThemes(rec)) {
      const key = t.theme.toLowerCase();
      const cur = baselineThemes.get(key);
      if (!cur || SEV[t.severity] > SEV[cur]) baselineThemes.set(key, t.severity);
      if (!baselineNames.has(key)) baselineNames.set(key, t.theme);
    }
  }

  // Detect changes
  const findings: Array<{
    changeType: string;
    theme?: string;
    recentSeverity?: string;
    baselineSeverity?: string;
    sentimentDelta?: number;
    direction?: string;
  }> = [];

  for (const [key, sev] of recentThemes) {
    if (!baselineThemes.has(key)) {
      findings.push({ changeType: "NEW_ISSUE", theme: recentNames.get(key) ?? key, recentSeverity: sev });
    } else {
      const baseSev = baselineThemes.get(key)!;
      if (SEV[sev] > SEV[baseSev]) {
        findings.push({ changeType: "ESCALATING", theme: recentNames.get(key) ?? key, recentSeverity: sev, baselineSeverity: baseSev });
      }
    }
  }

  if (baselineData.length > 0) {
    for (const [key] of baselineThemes) {
      if (!recentThemes.has(key)) {
        findings.push({ changeType: "RESOLVED", theme: baselineNames.get(key) ?? key });
      }
    }

    const recentNeg  = avgField(recentData,   "negative");
    const baselineNeg = avgField(baselineData, "negative");
    const recentPos  = avgField(recentData,   "positive");
    const baselinePos = avgField(baselineData, "positive");

    if (recentNeg - baselineNeg > 3) {
      findings.push({ changeType: "SENTIMENT_DECLINING", sentimentDelta: Math.round(recentNeg - baselineNeg), direction: "negative" });
    }
    if (recentPos - baselinePos > 3) {
      findings.push({ changeType: "SENTIMENT_IMPROVING", sentimentDelta: Math.round(recentPos - baselinePos), direction: "positive" });
    }
  }

  if (findings.length === 0) {
    return NextResponse.json({ warnings: [], insufficient_data: false, weeksAnalyzed: records.length });
  }

  const prompt = `You are a reputation early warning system. Based on these complaint trend changes, generate actionable alerts. Return ONLY a JSON array with no markdown:
[{
  "type": "warning" | "positive" | "info",
  "severity": "high" | "medium" | "low",
  "title": "string — short, specific e.g. 'Food Safety Complaints Spiking'",
  "detail": "string — 1-2 sentences with specific data",
  "action": "string — one specific thing to do about it"
}]
Data: ${JSON.stringify(findings)}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ error: "Claude returned invalid JSON" }, { status: 500 });

    return NextResponse.json({
      warnings: JSON.parse(match[0]),
      insufficient_data: false,
      weeksAnalyzed: records.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
