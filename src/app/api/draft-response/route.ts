import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const client = new Anthropic();

function buildPrompt(reviewerName: string, rating: number, comment: string, businessName: string): string {
  let toneInstruction: string;

  if (rating === 5) {
    toneInstruction = "Be enthusiastic, warm, and genuinely grateful. Match the reviewer's positive energy.";
  } else if (rating === 4) {
    toneInstruction = "Be warm, positive, and appreciative. Acknowledge the great experience while subtly noting you'd love to earn that fifth star next time.";
  } else if (rating === 3) {
    toneInstruction = "Be empathetic and constructive. Acknowledge the mixed experience, thank them for the honest feedback, and briefly mention what you're doing to improve.";
  } else {
    toneInstruction = "Be apologetic, empathetic, and solution-focused. Take responsibility, express genuine regret, and invite them to give you another chance to make it right.";
  }

  return `You are a reputation manager helping ${businessName} respond to customer reviews on Google.

Write a professional, warm, and human-sounding response to this ${rating}-star review from ${reviewerName}.

Review: "${comment}"

Guidelines:
- ${toneInstruction}
- Keep it concise (2–4 sentences max).
- Address the reviewer by first name.
- Sound like a real person, not a template. Avoid generic filler phrases like "We appreciate your feedback."
- Do not make up specific details not mentioned in the review.
- End with a welcoming note if appropriate.
- Do not include a subject line, greeting label, or sign-off — just the response body.`;
}

export async function POST(request: NextRequest) {
  const { reviewerName, rating, comment, businessName } = await request.json();

  if (!reviewerName || !rating || !comment || !businessName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: buildPrompt(reviewerName, rating, comment, businessName),
      },
    ],
  });

  const responseText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({ response: responseText });
}
