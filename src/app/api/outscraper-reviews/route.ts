import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

interface OutscraperReviewItem {
  author_title?: string;
  review_rating?: number;
  review_text?: string | null;
  review_datetime_utc?: string;
  review_timestamp?: number;
  review_id?: string;
}

interface OutscraperPlace {
  rating?: number;
  reviews?: number;
  reviews_data?: OutscraperReviewItem[];
}

interface OutscraperResponse {
  status?: string;
  data?: OutscraperPlace[];
}

// Outscraper date format: "05/21/2026 23:57:53" → "2026-05-21"
function parseDate(dateStr: string): string {
  try {
    const [datePart] = dateStr.split(" ");
    const [month, day, year] = datePart.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
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

    const res = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
      { headers: { "X-API-KEY": apiKey } }
    );

    if (!res.ok) throw new Error(`Outscraper returned ${res.status}`);

    const data = (await res.json()) as OutscraperResponse;
    if (data.status !== "Success") throw new Error(`Outscraper: ${data.status ?? "unknown error"}`);

    const place = data.data?.[0];
    const rawReviews = place?.reviews_data ?? [];

    // Filter by date on our side (more reliable than cutoff parameter)
    const sinceTs = since ? new Date(since).getTime() : 0;

    const reviews = rawReviews
      .filter((r) => {
        if (!r.author_title) return false;
        // Filter to reviews newer than last sync
        if (sinceTs && r.review_timestamp) {
          return r.review_timestamp * 1000 > sinceTs;
        }
        return true;
      })
      .map((r) => ({
        externalId: r.review_id ?? null,
        reviewerName: r.author_title ?? "Google Reviewer",
        platform: "Google" as const,
        rating: r.review_rating ?? 0,
        text: r.review_text ?? "",
        date: r.review_datetime_utc
          ? parseDate(r.review_datetime_utc)
          : new Date().toISOString().slice(0, 10),
        responded: false,
        seen: false,
      }));

    // Return exact place stats so HomeScreen can show accurate numbers
    const stats = place?.reviews != null
      ? { totalReviews: place.reviews, avgRating: place.rating ?? null }
      : null;

    return NextResponse.json({ reviews, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews";
    console.error("[outscraper-reviews]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
