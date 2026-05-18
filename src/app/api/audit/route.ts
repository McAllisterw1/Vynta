import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { businessType, businessName, starRating, reviewCount } = await request.json() as {
      businessType: string;
      businessName?: string;
      starRating?: number | null;
      reviewCount?: number | null;
    };

    const hasRating = typeof starRating === "number" && starRating > 0;
    const hasCount = typeof reviewCount === "number" && reviewCount >= 0;

    const ratingLine = hasRating
      ? `Star rating: ${starRating.toFixed(1)} stars`
      : "Star rating: unknown (estimate conservatively)";

    const countLine = hasCount
      ? `Review count: ${reviewCount} reviews`
      : "Review count: unknown (estimate conservatively around 15-25 for a typical small business)";

    const businessLine = businessName ? `Business name: ${businessName}` : `Business type: ${businessType}`;

    const system = `You are a blunt, expert reputation consultant delivering a cold-read audit of a local business's Google reputation. Your job is to make the business owner uncomfortable enough to act — like a doctor delivering a real diagnosis.

SCORING RULES (be harsh — most businesses score 35-65):
- Base from rating: 5.0=60pts, 4.9=55pts, 4.8=48pts, 4.7=42pts, 4.6=38pts, 4.5=33pts, 4.4 or below=25pts, unknown=35pts
- Add from review count: 100+=25pts, 50-99=18pts, 30-49=13pts, 20-29=8pts, 10-19=4pts, under 10=0pts, unknown=6pts
- Cap at 95. Score above 80 only if 4.9+ stars AND 50+ reviews. Score above 75 only if 4.8+ AND 30+ reviews.

CONSUMER PSYCHOLOGY FACTS TO USE:
- 87% of consumers won't consider a business rated below 4.0
- Most consumers read at least 3 reviews before calling
- A 4.6 rating means roughly 1 in 3 potential customers scrolls past you
- Businesses in the Google Map Pack get 5-10x more calls than those below it
- Low review counts mean one bad review can tank your average instantly
- Reviews under 3 months old are weighted significantly more by Google's algorithm

FLAG THESE SPECIFICALLY:
- Under 4.9 stars: always flag, be specific about the math impact
- Under 50 reviews: flag as low
- Under 20 reviews: flag as urgent
- Under 10 reviews: flag as critical — "invisible to Google"

Return ONLY valid JSON, no markdown. Schema:
{
  "score": number (0-95),
  "headline": string (one punchy line, max 8 words, personal and specific),
  "findings": string[] (exactly 3 strings, each one specific, uncomfortable, data-backed — reference their actual numbers),
  "recommendation": string (one specific action sentence with a number — e.g. "You need 8 more 5-star reviews to reach 4.8"),
  "urgency": string (one sentence about competitors winning right now, today, this week)
}`;

    const userMsg = `Audit this business:
${businessLine}
${ratingLine}
${countLine}

Generate their reputation audit. Be specific to their exact numbers. Do not soften the findings.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[audit]", err);
    return NextResponse.json({ error: "Failed to generate audit" }, { status: 500 });
  }
}
