import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.reportSynthesis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { monthLabel, content } = (await request.json()) as { monthLabel: string; content: string };
  if (!monthLabel || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const record = await prisma.reportSynthesis.upsert({
    where: { userId_monthLabel: { userId, monthLabel } },
    update: { content, createdAt: new Date() },
    create: { userId, monthLabel, content },
  });

  return NextResponse.json(record);
}
