import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  const adminId = process.env.ADMIN_USER_ID;

  return NextResponse.json({
    userId,
    adminId: adminId ? `${adminId.slice(0, 8)}...` : null,
    match: userId === adminId,
    adminIdSet: !!adminId,
  });
}
