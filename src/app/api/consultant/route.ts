import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const client = new Anthropic();

async function getGoalsContext(userId: string): Promise<string> {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId, completed: false },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    if (goals.length === 0) return "";
    const lines = goals.map(g => `- ${g.rawText || g.title}`).join("\n");
    return `\n\nUSER'S ACTIVE GOALS (these are the source of truth — tailor all advice to help achieve them):\n${lines}`;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, system, maxTokens } = await request.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const goalsContext = await getGoalsContext(userId);
  const enhancedSystem = (system || "") + goalsContext;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: (typeof maxTokens === "number" && maxTokens > 0) ? maxTokens : 1000,
    system: enhancedSystem || undefined,
    messages,
  });

  const responseText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({ response: responseText });
}
