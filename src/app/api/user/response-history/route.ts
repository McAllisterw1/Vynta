import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await prisma.responseHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(history);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    businessName: string;
    reviewerName: string;
    rating: number;
    comment: string;
    response: string;
    tone?: string;
  };

  const entry = await prisma.responseHistory.create({
    data: { userId, ...body },
  });

  return NextResponse.json(entry);
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.responseHistory.deleteMany({ where: { userId } });

  return NextResponse.json({ cleared: true });
}
