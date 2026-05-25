import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const inbox = await prisma.smartInbox.findUnique({ where: { userId } });
    return NextResponse.json(inbox);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[smart-inbox GET] Prisma error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    businessName: string;
    zipCode: string;
    placeId?: string;
    baselineCount: number;
    lastKnownCount: number;
    verified?: boolean;
  };

  const inbox = await prisma.smartInbox.upsert({
    where: { userId },
    create: { userId, ...body, enabled: true },
    update: { ...body, enabled: true, setupDate: new Date() },
  });

  return NextResponse.json(inbox);
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Partial<{
    lastKnownCount: number;
    lastChecked: string;
    lastManualSync: string;
    enabled: boolean;
  }>;

  const data: Record<string, unknown> = {};
  if (body.lastKnownCount !== undefined) data.lastKnownCount = body.lastKnownCount;
  if (body.lastChecked) data.lastChecked = new Date(body.lastChecked);
  if (body.lastManualSync) data.lastManualSync = new Date(body.lastManualSync);
  if (body.enabled !== undefined) data.enabled = body.enabled;

  const inbox = await prisma.smartInbox.update({ where: { userId }, data });
  return NextResponse.json(inbox);
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { placeId } = await request.json() as { placeId?: string | null };

  const inbox = await prisma.smartInbox.update({
    where: { userId },
    data: { placeId: placeId ?? null },
  });

  return NextResponse.json(inbox);
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.smartInbox.deleteMany({ where: { userId } });
  return NextResponse.json({ deleted: true });
}
