import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

interface OutscraperReview {
  name?: string;
  rating?: number;
  text?: string;
  publishedAtDate?: string;
  reviewId?: string;
}

interface OutscraperResponse {
  status?: string;
  data?: OutscraperReview[][];
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { placeId, since } = (await request.json()) as {
    placeId: string;
    since?: string;
  };

  if (!placeId) return NextResponse.json({ error: "Place ID required" }, { status: 400 });

  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Outscraper not configured" }, { status: 500 });

  try {
    const params = new URLSearchParams({
      query: placeId,
      reviewsLimit: "25",
      sort: "newest",
      language: "en",
      async: "false",
    });

    // Only pull reviews newer than the last sync date
    if (since) {
      params.set("cutoff", String(new Date(since).getTime()));
    }

    const res = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
      { headers: { "X-API-KEY": apiKey } }
    );

    if (!res.ok) throw new Error(`Outscraper returned ${res.status}`);

    const data = (await res.json()) as OutscraperResponse;

    if (data.status !== "Success") {
      throw new Error(`Outscraper status: ${data.status ?? "unknown"}`);
    }

    const rawReviews = data.data?.[0] ?? [];

    const reviews = rawReviews
      .filter((r) => r.name && r.text)
      .map((r) => ({
        externalId: r.reviewId ?? null,
        reviewerName: r.name ?? "Google Reviewer",
        platform: "Google" as const,
        rating: r.rating ?? 0,
        text: r.text ?? "",
        date: r.publishedAtDate
          ? new Date(r.publishedAtDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        responded: false,
        seen: false,
      }));

    return NextResponse.json({ reviews });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews";
    console.error("[outscraper-reviews]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
