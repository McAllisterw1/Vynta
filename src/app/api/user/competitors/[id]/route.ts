import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as Partial<{
    rating: number; reviewCount: number; zipCode: string;
    sentiment: string; trend: string; velocity: string;
    analysisText: string; lastAnalyzed: string;
  }>;

  const data: Record<string, unknown> = {};
  if (body.rating !== undefined)       data.rating       = body.rating;
  if (body.reviewCount !== undefined)  data.reviewCount  = body.reviewCount;
  if (body.zipCode !== undefined)      data.zipCode      = body.zipCode;
  if (body.sentiment !== undefined)    data.sentiment    = body.sentiment;
  if (body.trend !== undefined)        data.trend        = body.trend;
  if (body.velocity !== undefined)     data.velocity     = body.velocity;
  if (body.analysisText !== undefined) data.analysisText = body.analysisText;
  if (body.lastAnalyzed !== undefined) data.lastAnalyzed = new Date(body.lastAnalyzed);

  try {
    const competitor = await prisma.competitor.update({ where: { id, userId }, data });
    return NextResponse.json(competitor);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.competitor.deleteMany({ where: { id, userId } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
