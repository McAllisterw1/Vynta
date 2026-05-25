import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as Partial<{
    reviewerName: string;
    platform: string;
    rating: number;
    text: string;
    date: string;
    responded: boolean;
    seen: boolean;
    smartInbox: boolean;
  }>;

  const review = await prisma.review.updateMany({
    where: { id, userId },
    data: body,
  });

  return NextResponse.json(review);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.review.deleteMany({ where: { id, userId } });

  return NextResponse.json({ deleted: true });
}
