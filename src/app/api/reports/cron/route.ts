import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Add real userIds here as the product grows
const TEST_USER_IDS: string[] = [];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() === 0 ? 12 : now.getMonth(); // previous month
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let reportsGenerated = 0;

  for (const userId of TEST_USER_IDS) {
    try {
      const res = await fetch(`${baseUrl}/api/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          businessName: "Test Business",
          month,
          year,
          totalReviews: 0,
          avgRating: 0,
          requestsSent: 0,
          aiResponsesGenerated: 0,
          reviewsFromVynta: 0,
          competitors: [],
        }),
      });
      if (res.ok) reportsGenerated++;
    } catch (err) {
      console.error(`[reports/cron] failed for userId ${userId}:`, err);
    }
  }

  return NextResponse.json({ success: true, reportsGenerated });
}
