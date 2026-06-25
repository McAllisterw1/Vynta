import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const client = new Anthropic();

interface Competitor {
  name: string;
  rating: number;
  reviewCount: number;
}

interface GenerateBody {
  userId: string;
  businessName: string;
  month: number;
  year: number;
  totalReviews: number;
  avgRating: number;
  requestsSent: number;
  aiResponsesGenerated: number;
  reviewsFromVynta: number;
  competitors: Competitor[];
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as GenerateBody;
    const {
      userId,
      businessName,
      month,
      year,
      totalReviews,
      avgRating,
      requestsSent,
      aiResponsesGenerated,
      reviewsFromVynta,
      competitors,
    } = body;

    if (!userId || !businessName) {
      return NextResponse.json({ error: "userId and businessName are required" }, { status: 400 });
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[(month - 1) % 12];

    const competitorText = competitors.length > 0
      ? competitors.map((c) => `${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join(", ")
      : "No competitor data available";

    const system = `You are a business reputation analyst generating a monthly report for a local business. Return only valid JSON, no markdown, no explanation. The JSON must have exactly two keys: "competitorComparison" (string) and "aiSummary" (string).`;

    const userMsg = `Generate a monthly reputation report for ${monthName} ${year}.

Business: ${businessName}
Stats for ${monthName} ${year}:
- Total logged reviews: ${totalReviews}
- Average rating: ${avgRating}
- Review requests sent: ${requestsSent}
- AI responses generated: ${aiResponsesGenerated}
- Reviews attributed to Vynta requests: ${reviewsFromVynta}
- Competitors: ${competitorText}

Return JSON with:
1. "competitorComparison": 2-3 sentences comparing this business to competitors. Be specific and data-driven.
2. "aiSummary": 3-4 sentences on how this month went, what improved, and what to focus on next month. Be direct and coach-like.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(raw) as { competitorComparison: string; aiSummary: string };

    const report = await prisma.monthlyReport.create({
      data: {
        userId,
        businessName,
        month,
        year,
        totalReviews,
        avgRating,
        requestsSent,
        aiResponsesGenerated,
        reviewsFromVynta,
        competitorComparison: parsed.competitorComparison,
        aiSummary: parsed.aiSummary,
      },
    });

    return NextResponse.json(report);
  } catch (err) {
    console.error("[reports/generate]", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
