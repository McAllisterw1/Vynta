import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const anthropic = new Anthropic();

interface OutscraperReviewItem {
  review_text?: string | null;
  review_rating?: number;
}

interface OutscraperPlace {
  reviews_data?: OutscraperReviewItem[];
}

interface OutscraperResponse {
  status?: string;
  data?: OutscraperPlace[];
}

async function fetchCompetitorReviews(name: string, zipCode: string): Promise<string[]> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({
      query: `${name} ${zipCode}`,
      reviewsLimit: "30",
      sort: "lowest_rating",
      language: "en",
      async: "false",
    });
    const res = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
      { headers: { "X-API-KEY": apiKey }, signal: AbortSignal.timeout(40_000) }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as OutscraperResponse;
    if (data.status !== "Success") return [];
    return (data.data?.[0]?.reviews_data ?? [])
      .filter((r) => r.review_text && r.review_text.trim().length > 5)
      .map((r) => r.review_text!.trim());
  } catch {
    return [];
  }
}

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

    const reviews = await fetchCompetitorReviews(competitor.name, competitor.zipCode);
    const hasReviews = reviews.length > 0;

    const reviewsBlock = hasReviews
      ? `\nReal customer reviews (lowest-rated, most critical):\n${reviews.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : "";

    const prompt = hasReviews
      ? `You are a reputation intelligence analyst. A business owner wants to understand what their competitor's customers are complaining about so they can capitalize on those gaps.

Competitor: ${competitor.name}
Rating: ${competitor.rating}/5 stars · ${competitor.reviewCount} total reviews
${reviewsBlock}

Analyze the reviews above and return ONLY valid JSON, no markdown, no code fences:
{
  "sentiment": { "positive": <0-100 integer>, "neutral": <0-100 integer>, "negative": <0-100 integer> },
  "trend": "<improving|stable|declining>",
  "velocity": "<short string e.g. ~4 reviews/month>",
  "strengths": ["<something customers actually praise them for>", "<another genuine strength>", "<another>"],
  "weaknesses": ["<specific complaint theme from the reviews>", "<another real complaint>", "<another>"],
  "summary": "<1-2 sentences on what customers consistently complain about and what opportunities that creates for a competitor>"
}

Rules:
- weaknesses must come directly from complaint patterns in the reviews — no guessing
- strengths: infer from the overall rating and any positive signals in the reviews
- sentiment: weight heavily negative since these are the lowest-rated reviews; adjust positive upward based on overall ${competitor.rating} star rating
- sentiment values must sum to 100
- velocity: estimate from ${competitor.reviewCount} reviews over a typical 3-5 year business life`
      : `You are a reputation intelligence analyst. Analyze this competitor business for a rival business owner.

Business: ${competitor.name}
Rating: ${competitor.rating}/5 stars
Total reviews: ${competitor.reviewCount}

Return ONLY valid JSON, no markdown, no code fences:
{
  "sentiment": { "positive": <0-100 integer>, "neutral": <0-100 integer>, "negative": <0-100 integer> },
  "trend": "<improving|stable|declining>",
  "velocity": "<short string e.g. ~4 reviews/month>",
  "strengths": ["<inferred strength>", "<another>", "<another>"],
  "weaknesses": ["<plausible weakness for this rating/volume>", "<another>", "<another>"],
  "summary": "<1-2 sentence competitive positioning>"
}
- sentiment values must sum to 100
- velocity: estimate from ${competitor.reviewCount} reviews over 3-5 years
- trend: 4.5+ improving, 3.5–4.4 stable, below declining`;

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
