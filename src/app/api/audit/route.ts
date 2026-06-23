import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const { allowed } = checkRateLimit(ip, 2, 24 * 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json({ error: "You've used your free audits for today. Sign up to get full access." }, { status: 429 })
    }
    const { businessName, starRating, reviewCount } = (await request.json()) as {
      businessName: string;
      starRating: number | null;
      reviewCount: number | null;
    };

    const hasRating = typeof starRating === "number" && !isNaN(starRating);
    const hasCount = typeof reviewCount === "number" && !isNaN(reviewCount);

    const ratingLine = hasRating
      ? `Google star rating: ${starRating!.toFixed(1)} ★`
      : "Google star rating: unknown";

    const countLine = hasCount
      ? `Total Google reviews: ${reviewCount}`
      : "Total Google reviews: unknown";

    const system = `You are a sharp, direct sales advisor for Vynta — a reputation management tool that helps local businesses get more Google reviews, respond to them with AI, and track their reputation. You have just looked up a real business's Google data and your job is to show them, in very specific terms, exactly how Vynta solves their situation.

VYNTA'S CORE FEATURES (reference these specifically based on their data):
- AI Review Responder: generates professional replies to any review in seconds
- Review Request Campaigns: sends personalized SMS/email to customers asking for reviews
- Score Predictor: shows exactly how many 5-star reviews they need to hit a target rating
- Reputation Crisis Detection: alerts them instantly when negative reviews spike
- Recovery Mode: AI-generated action plan for handling bad reviews
- Monthly Reports: auto-generated reputation reports with competitor comparison
- Competitor Tracker: monitors competitor ratings and review counts

TONE: Confident, specific, and friendly. Like a knowledgeable friend telling them exactly what they need to do. Not salesy. Not corporate. Short sentences. Real numbers.

Return ONLY valid JSON — no markdown, no explanation. Schema:
{
  "score": number (0-95, calculate based on: 4.9-5.0=75+, 4.7-4.8=60-70, 4.5-4.6=50-60, below 4.5=35-50, add 10 if 50+ reviews, add 5 if 20-49 reviews, subtract 5 if under 10 reviews),
  "hook": string (one punchy line, max 10 words, reference their specific rating or review count),
  "insight": string (2 sentences: what their real numbers mean for their business in plain English — be specific about the math, e.g. customers lost, competitor risk),
  "solutions": string[] (exactly 3 strings — each one names a specific Vynta feature and explains exactly how it helps THIS business given their specific numbers. Be concrete. Example: "Score Predictor shows you need exactly 8 more 5-star reviews to reach 4.8 — Vynta maps that out and tracks every step."),
  "cta": string (one energetic sentence about what happens when they start today)
}`;

    const userMsg = `Look up results for this business:
Business name: ${businessName}
${ratingLine}
${countLine}

Generate a personalized pitch showing exactly how Vynta helps them based on these real numbers.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
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
