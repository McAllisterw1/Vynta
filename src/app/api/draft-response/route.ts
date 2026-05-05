import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const client = new Anthropic();

type Tone = "professional" | "friendly" | "apologetic" | "savage";

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  professional: "Respond in a polished, professional tone.",
  friendly: "Respond in a warm, friendly tone.",
  apologetic: "Respond in an apologetic, empathetic tone.",
  savage: "Write this response as someone who is clearly, effortlessly smarter than the reviewer and is taking a moment out of their busy day to gently explain reality to them. The tone is impeccably polite — almost patient — but every sentence should make the reviewer feel like a student who just said something embarrassing in a lecture hall. Correct their misunderstanding with the kind of calm, precise condescension that a professor uses when they already know the answer and are merely waiting for the class to catch up. Do not insult. Do not raise your voice. Simply be so thoroughly, quietly correct that the reviewer feels the weight of their own error. The sting comes not from aggression but from the implication that their complaint barely warranted a response — and yet here one is, graciously provided. Fully postable on Google.",
};

function buildPrompt(reviewerName: string, rating: number, comment: string, businessName: string, tone: Tone): string {
  if (tone === "savage") {
    return `You are responding on behalf of ${businessName} to a ${rating}-star Google review left by ${reviewerName}.

Review: "${comment}"

${TONE_INSTRUCTIONS.savage}

- Keep it concise (2–4 sentences max).
- Address the reviewer by first name.
- Do not include a subject line, greeting label, or sign-off — just the response body.`;
  }

  let ratingInstruction: string;

  if (rating === 5) {
    ratingInstruction = "Be enthusiastic and genuinely grateful. Match the reviewer's positive energy.";
  } else if (rating === 4) {
    ratingInstruction = "Be positive and appreciative. Acknowledge the great experience while subtly noting you'd love to earn that fifth star next time.";
  } else if (rating === 3) {
    ratingInstruction = "Be constructive. Acknowledge the mixed experience, thank them for the honest feedback, and briefly mention what you're doing to improve.";
  } else {
    ratingInstruction = "Be solution-focused. Take responsibility, express genuine regret, and invite them to give you another chance to make it right.";
  }

  return `You are a reputation manager helping ${businessName} respond to customer reviews on Google.

Write a human-sounding response to this ${rating}-star review from ${reviewerName}.

Review: "${comment}"

Guidelines:
- ${TONE_INSTRUCTIONS[tone]}
- ${ratingInstruction}
- Keep it concise (2–4 sentences max).
- Address the reviewer by first name.
- Sound like a real person, not a template. Avoid generic filler phrases like "We appreciate your feedback."
- Do not make up specific details not mentioned in the review.
- End with a welcoming note if appropriate.
- Do not include a subject line, greeting label, or sign-off — just the response body.`;
}

export async function POST(request: NextRequest) {
  const { reviewerName, rating, comment, businessName, tone } = await request.json();

  if (!reviewerName || !rating || !comment || !businessName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resolvedTone: Tone =
    tone === "professional" || tone === "friendly" || tone === "apologetic" || tone === "savage"
      ? tone
      : "professional";

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: buildPrompt(reviewerName, rating, comment, businessName, resolvedTone),
      },
    ],
  });

  const responseText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({ response: responseText });
}
