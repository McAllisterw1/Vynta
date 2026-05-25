import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get("yearMonth") ?? getCurrentYearMonth();

  const usage = await prisma.monthlyUsage.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } },
  });

  return NextResponse.json({ count: usage?.count ?? 0, yearMonth });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { yearMonth } = await request.json() as { yearMonth?: string };
  const ym = yearMonth ?? getCurrentYearMonth();

  const usage = await prisma.monthlyUsage.upsert({
    where: { userId_yearMonth: { userId, yearMonth: ym } },
    create: { userId, yearMonth: ym, count: 1 },
    update: { count: { increment: 1 } },
  });

  return NextResponse.json({ count: usage.count, yearMonth: ym });
}

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
