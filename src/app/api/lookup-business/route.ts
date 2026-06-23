import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface SerperPlace {
  title?: string;
  rating?: number;
  ratingCount?: number;
  address?: string;
  phoneNumber?: string;
}

interface SerperResponse {
  places?: SerperPlace[];
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const { allowed } = checkRateLimit(ip, 2, 24 * 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: "You've used your free lookups for today. Sign up to get full access." }, { status: 429 })
  }

  const { businessName, zipCode } = (await request.json()) as {
    businessName: string;
    zipCode: string;
  };

  if (!businessName?.trim() || !zipCode?.trim()) {
    return NextResponse.json(
      { error: "Business name and zip code are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Serper API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://google.serper.dev/places", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${businessName.trim()} ${zipCode.trim()}`,
        gl: "us",
        num: 5,
      }),
    });

    if (!res.ok) {
      throw new Error(`Serper returned ${res.status}`);
    }

    const data = (await res.json()) as SerperResponse;
    const place = data.places?.[0];

    if (!place) {
      return NextResponse.json(
        { error: "Business not found. Try a more specific name or check the zip code." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      businessName: place.title ?? businessName.trim(),
      starRating: place.rating ?? null,
      reviewCount: place.ratingCount ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    console.error("[lookup-business]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
