import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cache = await prisma.sentimentCache.findUnique({ where: { userId } });
  return NextResponse.json(cache);
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cacheKey, data } = await request.json() as { cacheKey: string; data: object };

  const cache = await prisma.sentimentCache.upsert({
    where: { userId },
    create: { userId, cacheKey, data },
    update: { cacheKey, data },
  });

  return NextResponse.json(cache);
}
