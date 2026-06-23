import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

interface OutscraperPollResponse {
  id?: string;
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { placeId } = (await request.json()) as {
    placeId: string;
    since?: string;
  };

  if (!placeId) return NextResponse.json({ error: "Place ID required" }, { status: 400 });

  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Outscraper not configured" }, { status: 500 });

  try {
    // async=true forces a live Google scrape instead of returning cached data
    const params = new URLSearchParams({
      query: placeId,
      reviewsLimit: "50",
      sort: "newest",
      language: "en",
      async: "true",
    });

    const submitRes = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
      { headers: { "X-API-KEY": apiKey }, signal: AbortSignal.timeout(10_000) }
    );

    if (!submitRes.ok) throw new Error(`Outscraper returned ${submitRes.status}`);

    const submitJson = (await submitRes.json()) as OutscraperPollResponse;
    const requestId = submitJson.id;
    if (!requestId) throw new Error("Outscraper did not return a request ID");

    // Poll for results — up to 45 seconds (15 × 3s)
    let place: OutscraperPlace | undefined;
    for (let i = 0; i < 15; i++) {
      await sleep(3000);
      const pollRes = await fetch(
        `https://api.app.outscraper.com/requests/${requestId}`,
        { headers: { "X-API-KEY": apiKey }, signal: AbortSignal.timeout(8_000) }
      );
      const pollJson = (await pollRes.json()) as OutscraperPollResponse;

      if (pollJson.status === "Success") {
        place = pollJson.data?.[0];
        break;
      }
      if (pollJson.status === "ERROR" || pollJson.status === "Failed") {
        throw new Error("Outscraper scrape job failed");
      }
      // Still "Pending" — keep polling
    }

    if (!place) throw new Error("Outscraper timed out — please try syncing again in a moment");

    const rawReviews = place.reviews_data ?? [];

    const reviews = rawReviews
      .filter((r) => r.author_title)
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

    const stats = place.reviews != null
      ? { totalReviews: place.reviews, avgRating: place.rating ?? null }
      : null;

    return NextResponse.json({ reviews, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews";
    console.error("[outscraper-reviews]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
