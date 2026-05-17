import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const reports = await prisma.monthlyReport.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error("[reports/list]", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
