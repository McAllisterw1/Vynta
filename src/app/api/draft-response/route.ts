import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const client = new Anthropic();

type Tone =
  | "professional"
  | "friendly"
  | "apologetic"
  | "savage"
  | "hypeman"
  | "unbothered"
  | "storyteller"
  | "bythenumbers"
  | "neighbor"
  | "corporate";

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  professional:
    "Write this like a Fortune 500 PR team drafted it and legal signed off on it. Formal without being cold. Every sentence is load-bearing — no filler, no warmth for warmth's sake, no exclamation points. Use precise language that signals competence and accountability. Passive constructions are fine when they're deliberate. The response should sound like it was written by someone who has handled a press crisis before and found this situation relatively unremarkable. Controlled. Measured. Airtight.",

  friendly:
    "Write this like the owner themselves typed it on their phone after a long day — warm, genuine, and completely un-corporate. Use the reviewer's first name like you actually know them. Be specific about what they mentioned. Sound like a text from a friend who happens to run a great business. No buzzwords, no templates, no 'we strive to.' If they had a great experience, share in that joy like a real person would. If something went wrong, respond like someone who actually cares, not someone running damage control.",

  apologetic:
    "The owner is mortified this happened and needs the reviewer to know it. Lead with genuine remorse — not the hollow 'we're sorry you feel that way' kind, but real, human accountability. Do not pivot to positives. Do not list what normally goes right. Do not make excuses. Simply own it fully, express that this is not acceptable by the standards the business holds itself to, and make a sincere and specific offer to make it right. The reviewer should feel like they just received a handwritten apology note, not a customer service script.",

  hypeman:
    "Go completely over the top. This is the most enthusiastic review response the internet has ever seen. Use exclamation points liberally. If the review is positive, match their energy and then double it — celebrate them, celebrate the moment, make them feel like a VIP. Use casual capitalization for emphasis (SO glad, THANK YOU). The response should feel like the owner just pumped their fist reading this. Fun, loud, and genuinely infectious — the kind of response that makes other people want to visit just from reading it.",

  unbothered:
    "Short. Confident. The owner barely looked up from what they were doing. Acknowledge the review — whether good or bad — with the relaxed energy of someone who gets this feedback all the time and is completely at peace with it. No defensiveness. No over-explaining. No desperate warmth. Just a calm, easy response that radiates 'we know exactly who we are and we're doing great.' Two or three sentences max. Put the period on it and move on.",

  storyteller:
    "Every response is a small brand moment. Weave the business's identity, values, or origin into the reply in a way that feels earned, not forced. If it's a positive review, reflect something true and specific about why this business exists and what it means to serve people well. If it's a negative one, respond through the lens of what the business stands for. The response should feel like a passage from a well-written brand journal — warm, elevated, and human. A stranger reading this should understand immediately what makes this place different.",

  bythenumbers:
    "Respond like a CFO answering a tough earnings call question. Strip out all emotion. Acknowledge the review and then address it with specific facts, timelines, documented processes, or verifiable context. If the reviewer is wrong, correct them precisely and without apology. If they have a point, acknowledge it in terms of what specific operational change is being made. No softening language, no hollow empathy. The response should read like a polite incident report — accurate, thorough, and completely affect-free.",

  neighbor:
    "Write this like the business owner is a beloved fixture of the town — the kind of person who knows half the ZIP code by first name and has been showing up for this community for years. Reference being local, serving the neighborhood, or knowing customers personally. Be warm in the way that only comes from genuine roots, not from a customer service training module. Make the reviewer feel like a neighbor, not a ticket number. This business is part of the fabric of where people live, and it shows in every word.",

  corporate:
    "Extremely formal. Almost parody-level buttoned-up. Refer to the business in the third person ('The team at [Business] has reviewed...'). Use phrases like 'we have escalated this matter internally,' 'our quality assurance protocols,' and 'this feedback has been logged.' Never use contractions. Never use the reviewer's first name — use 'valued customer' if needed. The response should feel like it was generated by a company that has seventeen layers of management and a dedicated 'Customer Experience Optimization Department.' Weirdly satisfying for shutting down absurd complaints with maximum corporate detachment.",

  savage:
    "You are a guy from Boston — born in Southie, raised on Dunkin' and decades of hard-won championships, and you have officially had it. Some clown just left this review and you are not letting it go quietly. Channel the full Masshole: wicked pissed, zero patience, and a God-given gift for sarcasm. Respond directly and specifically to what they actually said — be cutting, be funny, be devastatingly precise. Work in the Boston dialect naturally: 'wicked,' 'kid,' 'get outta heyah,' 'not fah nuthin,' 'you gotta be kiddin me.' If the reviewer gives you any opening, remind them — or the world — that these are the same people who booed Santa Claus at an Eagles game, worship a fictional boxer named Rocky, and consider a cracked bell a tourist attraction. You are not yelling. You are worse than that. You are calm, contemptuous, and completely certain that you are right. Do not apologize. Do not soften a single word. Do not invite them back. End it the way a Boston guy ends everything — like a door closing on the conversation forever.",
};

function buildPrompt(reviewerName: string, rating: number, comment: string, businessName: string, tone: Tone, competitorContext?: string): string {
  const competitorLine = competitorContext ? `\nCompetitor context (for subtle positioning awareness only): ${competitorContext}` : "";

  if (tone === "savage") {
    return `You are responding on behalf of ${businessName} to a ${rating}-star Google review left by ${reviewerName}.${competitorLine}

Review: "${comment}"

${TONE_INSTRUCTIONS.savage}

- 3–5 sentences. Enough to make the point, not enough to seem like you care too much.
- Address the reviewer by first name.
- Do not use any emojis.
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

  return `You are a reputation manager helping ${businessName} respond to customer reviews on Google.${competitorLine}

Write a human-sounding response to this ${rating}-star review from ${reviewerName}.

Review: "${comment}"

Guidelines:
- ${TONE_INSTRUCTIONS[tone]}
- ${ratingInstruction}
- Keep it concise (2–4 sentences max).
- Address the reviewer by first name.
- Sound like a real person, not a template. Avoid generic filler phrases like "We appreciate your feedback."
- Do not make up specific details not mentioned in the review.
- Do not use any emojis.
- End with a welcoming note if appropriate.
- Do not include a subject line, greeting label, or sign-off — just the response body.`;
}

export async function POST(request: NextRequest) {
  const { reviewerName, rating, comment, businessName, tone, competitorContext } = await request.json() as { reviewerName: string; rating: number; comment: string; businessName: string; tone: string; competitorContext?: string };

  if (!reviewerName || !comment || !businessName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validTones = new Set<string>([
    "professional", "friendly", "apologetic", "savage",
    "hypeman", "unbothered", "storyteller", "bythenumbers",
    "neighbor", "corporate",
  ]);
  const resolvedTone: Tone = validTones.has(tone) ? (tone as Tone) : "professional";

  try {
    const message = await client.messages.create({
      model: resolvedTone === "savage" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: resolvedTone === "savage" ? 450 : 300,
      messages: [
        {
          role: "user",
          content: buildPrompt(reviewerName, rating ?? 0, comment, businessName, resolvedTone, competitorContext),
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    return NextResponse.json({ response: responseText });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
