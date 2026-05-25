import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const competitor = await prisma.competitor.findFirst({ where: { id, userId } });
    if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (competitor.lastAnalyzed) {
      const hoursSince = (Date.now() - competitor.lastAnalyzed.getTime()) / 3600000;
      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        return NextResponse.json(
          { error: `Refresh available in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}` },
          { status: 429 }
        );
      }
    }

    const daysSinceAdded = Math.floor(
      (Date.now() - competitor.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const prompt = `You are a reputation intelligence analyst. Analyze this competitor business.

Business: ${competitor.name}
Rating: ${competitor.rating}/5 stars
Total reviews: ${competitor.reviewCount}
Days tracked: ${daysSinceAdded}

Return ONLY valid JSON, no markdown, no code fences:
{
  "sentiment": { "positive": <0-100 integer>, "neutral": <0-100 integer>, "negative": <0-100 integer> },
  "trend": "<improving|stable|declining>",
  "velocity": "<short string e.g. ~4 reviews/month>",
  "summary": "<2-3 sentence competitive insight written for a rival business owner>"
}

Estimation rules:
- 4.5+ rating → roughly 70%+ positive sentiment
- 3.5–4.4 rating → mixed, more neutral/negative
- Below 3.5 → significant negative sentiment
- sentiment values must sum to 100
- velocity: for a business with ${competitor.reviewCount} reviews over typical business lifetime (3-5 years), estimate monthly rate
- trend: use rating as signal — 4.5+ is improving, 3.5–4.4 stable, below is declining`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    let parsed: {
      sentiment: { positive: number; neutral: number; negative: number };
      trend: string;
      velocity: string;
      summary: string;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Analysis failed. Try again." }, { status: 500 });
    }

    const updated = await prisma.competitor.update({
      where: { id },
      data: {
        sentiment:    JSON.stringify(parsed.sentiment),
        trend:        parsed.trend,
        velocity:     parsed.velocity,
        analysisText: parsed.summary,
        lastAnalyzed: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
