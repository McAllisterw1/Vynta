import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const client = new Anthropic();

interface ParsedIntent {
  type: "rating" | "reviews" | "response_rate" | "competitive" | "revenue" | "general";
  summary: string;
  targetValue: number | null;
  targetUnit: string | null;
  timeframe: string | null;
  competitor: string | null;
  quantifiable: boolean;
}

async function parseGoalIntent(rawText: string): Promise<ParsedIntent> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: "You parse business goals into structured JSON. Return ONLY a raw JSON object — no markdown, no backticks.",
    messages: [{
      role: "user",
      content: `Parse this business goal into JSON:
"${rawText}"

Return exactly this JSON shape:
{
  "type": "rating" | "reviews" | "response_rate" | "competitive" | "revenue" | "general",
  "summary": "5-8 word plain-English summary of the goal",
  "targetValue": number or null,
  "targetUnit": "stars" | "reviews" | "%" | "dollars" | null,
  "timeframe": "plain English timeframe or null",
  "competitor": "competitor name if mentioned, else null",
  "quantifiable": true or false
}`,
    }],
  });

  const raw = msg.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("")
    .replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  return JSON.parse(raw) as ParsedIntent;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    rawText?: string;
    title?: string;
    target?: number;
    current?: number;
    deadline?: string;
  };

  // Free-text goal path
  if (body.rawText) {
    let parsedIntent: ParsedIntent | null = null;
    let title = body.rawText.slice(0, 80);

    try {
      parsedIntent = await parseGoalIntent(body.rawText);
      title = parsedIntent.summary || title;
    } catch {}

    const goal = await prisma.goal.create({
      data: {
        userId,
        rawText: body.rawText,
        parsedIntent: parsedIntent ? JSON.stringify(parsedIntent) : undefined,
        title,
        target: parsedIntent?.targetValue ? Math.round(parsedIntent.targetValue) : 0,
        current: 0,
        deadline: "",
        completed: false,
      },
    });

    return NextResponse.json(goal);
  }

  // Legacy numeric goal path (for backwards compat)
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: body.title ?? "",
      target: body.target ?? 0,
      current: body.current ?? 0,
      deadline: body.deadline ?? "",
      completed: false,
    },
  });

  return NextResponse.json(goal);
}
