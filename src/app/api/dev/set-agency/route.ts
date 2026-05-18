import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.DEV_SECRET || auth !== `Bearer ${process.env.DEV_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = (await request.json()) as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { plan: "agency", subscriptionStatus: "active" },
  });

  return NextResponse.json({ success: true });
}
