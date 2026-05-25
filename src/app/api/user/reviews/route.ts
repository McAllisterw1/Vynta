import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    reviewerName: string;
    platform: string;
    rating: number;
    text: string;
    date: string;
    responded: boolean;
    seen: boolean;
    smartInbox?: boolean;
    externalId?: string | null;
  };

  const review = await prisma.review.create({
    data: { userId, ...body },
  });

  return NextResponse.json(review);
}

// Bulk upsert — used by Outscraper sync to import many reviews at once
export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reviews } = await request.json() as {
    reviews: Array<{
      reviewerName: string;
      platform: string;
      rating: number;
      text: string;
      date: string;
      responded: boolean;
      seen: boolean;
      smartInbox?: boolean;
      externalId?: string | null;
    }>;
  };

  // Only insert reviews whose externalId doesn't already exist
  const existingIds = await prisma.review.findMany({
    where: { userId, externalId: { not: null } },
    select: { externalId: true },
  });
  const existingSet = new Set(existingIds.map((r) => r.externalId));

  const toInsert = reviews.filter(
    (r) => !r.externalId || !existingSet.has(r.externalId)
  );

  if (toInsert.length === 0) return NextResponse.json({ inserted: 0 });

  await prisma.review.createMany({
    data: toInsert.map((r) => ({ userId, ...r })),
  });

  return NextResponse.json({ inserted: toInsert.length });
}
