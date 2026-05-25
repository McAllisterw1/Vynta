import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

interface OutscraperPlace {
  name?: string;
  rating?: number;
  reviews?: number;
}

interface OutscraperResponse {
  status?: string;
  data?: OutscraperPlace[];
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { placeId?: string; query?: string };
  const query = body.placeId?.trim() || body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "Place ID or search query required" }, { status: 400 });
  }

  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Outscraper not configured" }, { status: 500 });

  try {
    const params = new URLSearchParams({
      query,
      reviewsLimit: "1",
      language: "en",
      async: "false",
    });

    const res = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
      { headers: { "X-API-KEY": apiKey } }
    );

    if (!res.ok) throw new Error(`Outscraper returned ${res.status}`);

    const data = await res.json() as OutscraperResponse;
    if (data.status !== "Success") throw new Error(`Outscraper: ${data.status ?? "unknown error"}`);

    const place = data.data?.[0];
    if (!place) {
      return NextResponse.json({ error: "Business not found. Check your Place ID or name." }, { status: 404 });
    }

    return NextResponse.json({
      businessName: place.name ?? null,
      reviewCount: place.reviews ?? null,
      starRating: place.rating ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    console.error("[outscraper-lookup]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
