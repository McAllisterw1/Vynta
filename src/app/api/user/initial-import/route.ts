import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

interface OutscraperResponse {
  status?: string;
  data?: Array<{ rating?: number; reviews_data?: OutscraperReviewItem[] }>;
}

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

  const body = (await request.json()) as { placeId?: string };
  const placeId = body.placeId?.trim();
  if (!placeId) return NextResponse.json({ error: "Place ID required" }, { status: 400 });

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  if (settings.initialImportPlaceId === placeId) {
    return NextResponse.json({ alreadyDone: true });
  }

  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Outscraper not configured" }, { status: 500 });

  try {
    const params = new URLSearchParams({
      query: placeId,
      reviewsLimit: "500",
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

    const businessData = data.data?.[0];
    const googleRating = businessData?.rating ?? 0;
    const rawReviews = (businessData?.reviews_data ?? []).filter((r) => r.author_title);

    // Sort newest first, cap at 500
    rawReviews.sort((a, b) => (b.review_timestamp ?? 0) - (a.review_timestamp ?? 0));
    const reviews = rawReviews.slice(0, 500);

    // Fetch all existing reviews by externalId for this user
    const existing = await prisma.review.findMany({
      where: { userId },
      select: { id: true, externalId: true },
    });
    const existingMap = new Map<string, string>(); // externalId → db id
    for (const r of existing) {
      if (r.externalId) existingMap.set(r.externalId, r.id);
    }

    const toInsert: Array<{
      userId: string;
      reviewerName: string;
      platform: string;
      rating: number;
      text: string;
      date: string;
      seen: boolean;
      externalId: string | null;
    }> = [];
    const idsForNewTab: string[] = []; // existing reviews that belong in New tab (top 25)
    const seenExternalIds = new Set<string>(); // dedup guard for inserts

    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      const isNewTab = i < 25; // first 25 → New (seen=false), rest → Seen (seen=true)
      const existingId = r.review_id ? existingMap.get(r.review_id) : undefined;

      if (existingId) {
        if (isNewTab) idsForNewTab.push(existingId);
        // seen=true already handled by the bulk updateMany below
      } else {
        const key = r.review_id ?? `__idx_${i}`;
        if (!seenExternalIds.has(key)) {
          seenExternalIds.add(key);
          toInsert.push({
            userId,
            reviewerName: r.author_title ?? "Google Reviewer",
            platform: "Google",
            rating: r.review_rating ?? 0,
            text: r.review_text ?? "",
            date: r.review_datetime_utc ? parseDate(r.review_datetime_utc) : new Date().toISOString().slice(0, 10),
            seen: !isNewTab,
            externalId: r.review_id ?? null,
          });
        }
      }
    }

    // Clean slate: move all existing Google reviews to Seen
    await prisma.review.updateMany({
      where: { userId, platform: "Google" },
      data: { seen: true },
    });

    // Promote the top-25 existing reviews back to New
    if (idsForNewTab.length > 0) {
      await prisma.review.updateMany({
        where: { id: { in: idsForNewTab } },
        data: { seen: false },
      });
    }

    // Insert all new reviews
    if (toInsert.length > 0) {
      await prisma.review.createMany({ data: toInsert });
    }

    // Mark import complete, store real Google rating
    await prisma.userSettings.update({
      where: { userId },
      data: {
        initialImportPlaceId: placeId,
        ...(googleRating > 0 && { googleRating }),
      },
    });

    const total = reviews.length;
    return NextResponse.json({
      success: true,
      total,
      inserted: toInsert.length,
      newTab: Math.min(25, total),
      seenTab: Math.max(0, total - 25),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    console.error("[initial-import]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
