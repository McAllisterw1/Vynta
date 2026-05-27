import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.sentimentHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStart, data } = (await request.json()) as { weekStart: string; data: object };
  if (!weekStart || !data) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const record = await prisma.sentimentHistory.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    update: { data, createdAt: new Date() },
    create: { userId, weekStart, data },
  });

  return NextResponse.json(record);
}
