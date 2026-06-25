import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
