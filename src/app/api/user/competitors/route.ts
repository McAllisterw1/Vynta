import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const competitors = await prisma.competitor.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(competitors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    name: string;
    zipCode?: string;
    rating: number;
    reviewCount: number;
  };
  const { name, zipCode, rating, reviewCount } = body;

  try {
    const competitor = await prisma.competitor.create({
      data: { userId, name, zipCode: zipCode ?? "", rating, reviewCount },
    });
    return NextResponse.json(competitor);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[competitors POST] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
