import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

interface OutscraperReview {
  review_text?: string | null;
  review_rating?: number;
  review_datetime_utc?: string;
}

interface OutscraperPlace {
  name?: string;
  rating?: number;
  reviews?: number;
  reviews_data?: OutscraperReview[];
}

interface OutscraperResponse {
  data?: OutscraperPlace[];
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin-only — verify by email via Clerk
  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as { placeId: string; businessName?: string };
  const { placeId, businessName: nameOverride } = body;
  if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });

  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Outscraper not configured" }, { status: 500 });

  // ── Fetch from Outscraper (25 reviews to keep costs low) ──
  const params = new URLSearchParams({
    query: placeId,
    reviewsLimit: "25",
    sort: "newest",
    language: "en",
    async: "false",
  });

  const osRes = await fetch(
    `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
    { headers: { "X-API-KEY": apiKey }, signal: AbortSignal.timeout(45_000) }
  );

  if (!osRes.ok) {
    return NextResponse.json({ error: "Outscraper request failed" }, { status: 502 });
  }

  const osData = await osRes.json() as OutscraperResponse;
  const place = osData.data?.[0];
  if (!place) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const businessName = nameOverride || place.name || "Unknown Business";
  const rating       = place.rating ?? null;
  const totalReviews = place.reviews ?? null;
  const reviews      = (place.reviews_data ?? []).filter((r) => r.review_text);

  // ── Quick Claude sentiment pass ──
  interface SentimentResult {
    positive: number;
    trending: "improving" | "declining" | "stable";
    praiseThemes: string[];
    complaintThemes: Array<{ theme: string; severity: "low" | "medium" | "high" }>;
    topAction: string;
  }
  let sentiment: SentimentResult | null = null;

  if (reviews.length >= 3) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const reviewText = reviews
        .slice(0, 20)
        .map((r) => `[${r.review_rating}★] ${r.review_text}`)
        .join("\n\n");

      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `Analyze these Google reviews for ${businessName} and respond ONLY with valid JSON matching this schema exactly:
{
  "positive": <integer 0-100, percentage of positive sentiment>,
  "trending": <"improving" | "declining" | "stable">,
  "praiseThemes": [<up to 4 short theme strings, what customers love>],
  "complaintThemes": [{"theme": <string>, "severity": <"low"|"medium"|"high">}],
  "topAction": <1-2 sentence specific actionable recommendation for the owner>
}

Reviews:
${reviewText}`,
        }],
      });

      const raw = (msg.content[0] as { type: string; text: string }).text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentiment = JSON.parse(jsonMatch[0]) as SentimentResult;
      }
    } catch {
      // Sentiment is optional — proceed without it
    }
  }

  return NextResponse.json({
    businessName,
    rating,
    totalReviews,
    positive: sentiment?.positive ?? null,
    trending: sentiment?.trending ?? null,
    praiseThemes: sentiment?.praiseThemes ?? [],
    complaintThemes: sentiment?.complaintThemes ?? [],
    topAction: sentiment?.topAction ?? null,
  });
}
