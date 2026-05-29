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

    const prompt = `You are a reputation intelligence analyst. Analyze this competitor business for a rival business owner who wants to understand how to compete against them.

Business: ${competitor.name}
Rating: ${competitor.rating}/5 stars
Total reviews: ${competitor.reviewCount}
Days tracked: ${daysSinceAdded}

Return ONLY valid JSON, no markdown, no code fences:
{
  "sentiment": { "positive": <0-100 integer>, "neutral": <0-100 integer>, "negative": <0-100 integer> },
  "trend": "<improving|stable|declining>",
  "velocity": "<short string e.g. ~4 reviews/month>",
  "strengths": ["<specific thing they appear to be doing well>", "<another strength>", "<another strength>"],
  "weaknesses": ["<specific thing they appear to be struggling with>", "<another weakness>", "<another weakness>"],
  "summary": "<1-2 sentence overall competitive positioning — what kind of business they are and how strong a rival they represent>"
}

Estimation rules:
- 4.5+ rating → roughly 70%+ positive sentiment
- 3.5–4.4 rating → mixed, more neutral/negative
- Below 3.5 → significant negative sentiment
- sentiment values must sum to 100
- velocity: for a business with ${competitor.reviewCount} reviews over typical business lifetime (3-5 years), estimate monthly rate
- trend: use rating as signal — 4.5+ is improving, 3.5–4.4 stable, below is declining
- strengths: infer from high rating/volume what they likely do well (e.g. "Consistent service quality suggested by 4.8 rating across ${competitor.reviewCount} reviews", "High review volume indicates strong customer engagement")
- weaknesses: even strong businesses have gaps — infer plausible ones from rating, volume, and typical patterns for this type of business (e.g. "Volume suggests possible inconsistency at scale", "Limited differentiation signals — high ratings but no standout factor visible")
- Give 3 items for each of strengths and weaknesses. Be specific and actionable, not generic.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    // Strip markdown code fences if Claude wrapped the response anyway
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    // Extract the JSON object in case there's any surrounding text
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Analysis failed. Try again." }, { status: 500 });
    }

    let parsed: {
      sentiment: { positive: number; neutral: number; negative: number };
      trend: string;
      velocity: string;
      strengths: string[];
      weaknesses: string[];
      summary: string;
    };

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Analysis failed. Try again." }, { status: 500 });
    }

    const updated = await prisma.competitor.update({
      where: { id },
      data: {
        sentiment:    JSON.stringify(parsed.sentiment),
        trend:        parsed.trend,
        velocity:     parsed.velocity,
        analysisText: JSON.stringify({
          summary:    parsed.summary,
          strengths:  parsed.strengths ?? [],
          weaknesses: parsed.weaknesses ?? [],
        }),
        lastAnalyzed: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
