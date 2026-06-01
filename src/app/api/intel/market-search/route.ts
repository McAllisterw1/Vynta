import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic();

// ── Serper types ──────────────────────────────────────────────────────────────

interface SerperOrganic {
  title?: string;
  snippet?: string;
  link?: string;
}

interface SerperLocalResult {
  title?: string;
  rating?: number;
  reviews?: number;
  address?: string;
}

interface SerperKnowledgeGraph {
  rating?: number;
  reviews?: number;
  description?: string;
}

interface SerperResult {
  organic?: SerperOrganic[];
  localResults?: SerperLocalResult[];
  knowledgeGraph?: SerperKnowledgeGraph;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function serperSearch(query: string, num: number, apiKey: string): Promise<SerperResult> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "us", num }),
    });
    if (!res.ok) throw new Error(`Serper returned ${res.status}`);
    return (await res.json()) as SerperResult;
  } catch (err) {
    console.error("[market-search] Serper failed:", query, err);
    return {};
  }
}

function extractOrganic(result: SerperResult) {
  return (result.organic ?? []).map((r) => ({
    title: r.title ?? "",
    snippet: r.snippet ?? "",
    link: r.link ?? "",
  }));
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Serper not configured" }, { status: 500 });

  const { businessName, businessType, businessAddress, competitors } =
    (await request.json()) as {
      businessName: string;
      businessType: string;
      businessAddress: string;
      competitors: Array<{ name: string; zipCode: string }>;
    };

  // Parse city from address: "617 S Sharon Amity Rd, Charlotte, NC 28211" → "Charlotte"
  const city = businessAddress?.split(",")[1]?.trim() || businessAddress?.trim() || "local area";

  const compSlice = (competitors ?? []).slice(0, 3);

  // Run all Serper searches in parallel
  const [visibilityResult, rankingResult, trendsResult, ...compResults] = await Promise.all([
    serperSearch(`${businessName} reviews ${city}`, 5, apiKey),
    serperSearch(`best ${businessType} ${city}`, 8, apiKey),
    serperSearch(`${businessType} ${city} complaints problems 2025 2026`, 5, apiKey),
    ...compSlice.map((c) => serperSearch(`${c.name} ${city} reviews`, 5, apiKey)),
  ]);

  // Structure all data for Claude
  const searchData = {
    businessVisibility: {
      query: `${businessName} reviews ${city}`,
      organic: extractOrganic(visibilityResult),
      knowledgeGraph: visibilityResult.knowledgeGraph ?? null,
    },
    marketRanking: {
      query: `best ${businessType} ${city}`,
      organic: extractOrganic(rankingResult),
      localResults: (rankingResult.localResults ?? []).map((r) => ({
        name: r.title,
        rating: r.rating,
        reviews: r.reviews,
        address: r.address,
      })),
    },
    competitorSearch: compSlice.map((c, i) => ({
      name: c.name,
      query: `${c.name} ${city} reviews`,
      organic: extractOrganic(compResults[i] ?? {}),
      knowledgeGraph: compResults[i]?.knowledgeGraph ?? null,
    })),
    marketTrends: {
      query: `${businessType} ${city} complaints problems 2025 2026`,
      organic: extractOrganic(trendsResult),
    },
  };

  const system =
    "You are a reputation intelligence analyst. Analyze the following search data and return ONLY a JSON object with no markdown, no backticks, no preamble.";

  const prompt = `Business: ${businessName}, Type: ${businessType}, City: ${city}

Search data:
${JSON.stringify(searchData, null, 2)}

Return this exact JSON structure:
{
  "searchVisibility": {
    "summary": "<2 sentences on how this business appears in search vs competitors>",
    "rank": "<e.g. 'Top 3' or 'Not in top results'>",
    "insights": ["<specific observation>", "<specific observation>", "<specific observation>"]
  },
  "marketPosition": {
    "topPlayers": [{"name": "<business name>", "note": "<why they dominate — 1 short sentence>"}],
    "opportunities": ["<specific gap or opportunity>", "<specific gap>", "<specific gap>"]
  },
  "competitorOnlinePresence": [
    {
      "name": "<competitor name>",
      "searchSummary": "<how they appear online in 1 sentence>",
      "vulnerability": "<one specific weakness found in search results>"
    }
  ],
  "marketTrends": {
    "emerging": ["<theme 1>", "<theme 2>", "<theme 3>"],
    "recommendation": "<single most important action based on all search data>"
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Claude returned invalid JSON" }, { status: 500 });

    return NextResponse.json(JSON.parse(match[0]));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
