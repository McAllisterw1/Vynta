import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic();

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompetitorInput {
  name: string;
  rating: number;
  reviewCount: number;
  sentiment: string | null;
  velocity: string | null;
  analysisText: string | null;
}

interface SentimentInput {
  positive: number;
  negative: number;
  trending: string;
  complaintThemes: Array<{ theme: string; severity: string }>;
  praiseThemes: string[];
  actionableInsights: string[];
  executiveSummary: {
    biggestOpportunity: string;
    biggestRisk: string;
    recommendedAction: string;
  };
}

interface RequestBody {
  businessName: string;
  businessType: string;
  userRating: number;
  userTotalReviews: number;
  competitors: CompetitorInput[];
  sentimentData: SentimentInput | null;
  respondedCount: number;
  totalImportedReviews: number;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as RequestBody;
  const {
    businessName, businessType, userRating, userTotalReviews,
    competitors, sentimentData, respondedCount, totalImportedReviews,
  } = body;

  const compSummary = competitors.map(c => {
    let weaknesses: string[] = [];
    try {
      const parsed = JSON.parse(c.analysisText ?? "{}") as { weaknesses?: string[] };
      weaknesses = parsed.weaknesses ?? [];
    } catch {}
    return {
      name: c.name,
      rating: c.rating,
      reviews: c.reviewCount,
      velocity: c.velocity,
      weaknesses,
    };
  });

  const system =
    "You are a revenue and opportunity analyst for local businesses. Your job is to find specific, quantified opportunities based on real data. Be specific — reference actual numbers, competitor names, and complaint themes. Never give generic advice.";

  const prompt = `Analyze this business and find their biggest opportunities.

Business: ${businessName} (${businessType})
Rating: ${userRating}★ across ${userTotalReviews} Google reviews
Review response rate: ${respondedCount} of ${totalImportedReviews} imported reviews responded to
Sentiment: ${sentimentData?.positive ?? "unknown"}% positive, ${sentimentData?.negative ?? "unknown"}% negative, trending ${sentimentData?.trending ?? "unknown"}
Top complaints: ${JSON.stringify(sentimentData?.complaintThemes ?? [])}
Top praise: ${JSON.stringify(sentimentData?.praiseThemes ?? [])}
Biggest opportunity (from sentiment): ${sentimentData?.executiveSummary?.biggestOpportunity ?? "not analyzed"}
Competitors: ${JSON.stringify(compSummary)}

Return this exact JSON — no markdown, no backticks:
{
  "revenueOpportunities": [
    {
      "title": "string",
      "impact": "high" | "medium" | "low",
      "estimatedValue": "string",
      "detail": "string",
      "action": "string",
      "timeToImpact": "string"
    }
  ],
  "competitorGaps": [
    {
      "title": "string",
      "competitor": "string",
      "opportunity": "string",
      "detail": "string",
      "urgency": "act now" | "this month" | "long term"
    }
  ],
  "quickWins": [
    {
      "action": "string",
      "why": "string",
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high"
    }
  ]
}

Rules:
- revenueOpportunities: 3-4 items, reference real numbers and names
- competitorGaps: 2-3 items, one per competitor weakness found
- quickWins: exactly 3 items, prioritize low effort high impact
- estimatedValue must be specific e.g. '$2,400/mo in recovered repeat visits' or '18% more profile clicks'
- timeToImpact e.g. 'immediate', '2-4 weeks', '30 days', '60-90 days'`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Claude returned invalid JSON" }, { status: 500 });

    try {
      return NextResponse.json(JSON.parse(match[0]));
    } catch {
      const revMatch = raw.match(/"revenueOpportunities"\s*:\s*(\[[\s\S]*?\])\s*(?:,|\}|$)/);
      if (revMatch) {
        try {
          return NextResponse.json({
            revenueOpportunities: JSON.parse(revMatch[1]) as unknown[],
            competitorGaps: [],
            quickWins: [],
          });
        } catch {}
      }
      return NextResponse.json({ error: "JSON parse failed" }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
