import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// ── Plan definitions ──────────────────────────────────────────────────────────

function planName(amount: number, interval: string): string {
  if (amount === 4900  && interval === "month") return "Starter";
  if (amount === 99000 && interval === "year")  return "Pro";
  if (amount === 199000 && interval === "year") return "Agency";
  return "Other";
}

function toMonthlyMrr(amount: number, interval: string): number {
  const dollars = amount / 100;
  return interval === "year" ? dollars / 12 : dollars;
}

const FIXED_COSTS = [
  { name: "Anthropic Credits",  cost: 20 },
  { name: "ChatGPT Plus",       cost: 20 },
  { name: "Vercel",             cost: 0  },
  { name: "Neon Database",      cost: 0  },
];
const FIXED_TOTAL = FIXED_COSTS.reduce((s, c) => s + c.cost, 0);

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchStripe() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const subs = await stripe.subscriptions.list({
    status: "active",
    limit: 100,
    expand: ["data.items.data.price"],
  });

  const planMap = new Map<string, { name: string; count: number; unitMrr: number }>();
  for (const sub of subs.data) {
    const price = sub.items.data[0]?.price;
    if (!price) continue;
    const amount   = price.unit_amount ?? 0;
    const interval = price.recurring?.interval ?? "month";
    const existing = planMap.get(price.id);
    if (existing) {
      existing.count++;
    } else {
      planMap.set(price.id, { name: planName(amount, interval), count: 1, unitMrr: toMonthlyMrr(amount, interval) });
    }
  }

  const plans    = Array.from(planMap.values()).map((p) => ({ ...p, totalMrr: p.count * p.unitMrr }));
  const totalMrr = plans.reduce((s, p) => s + p.totalMrr, 0);
  return { plans, totalMrr, activeSubCount: subs.data.length };
}

async function fetchTwilio() {
  const sid  = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const auth  = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Usage/Records/ThisMonth.json?Category=sms-outbound`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
  );
  if (!res.ok) return { smsCount: 0, cost: 0 };
  const data = await res.json() as { usage_records: Array<{ count: string; price: string }> };
  const rec  = data.usage_records?.[0];
  return { smsCount: parseInt(rec?.count ?? "0", 10), cost: parseFloat(rec?.price ?? "0") };
}

async function fetchOutscraperCredits(): Promise<number | null> {
  const res = await fetch("https://api.app.outscraper.com/profile", {
    headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  return (data.credits_remaining ?? data.credits ?? data.balance ?? null) as number | null;
}

async function fetchSerperCredits(): Promise<number | null> {
  const res = await fetch("https://google.serper.dev/account", {
    headers: { "X-API-KEY": process.env.SERPER_API_KEY! },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  const credits = data.credits as Record<string, unknown> | undefined;
  return (credits?.remaining ?? data.remainingCredits ?? null) as number | null;
}

async function fetchClaudeCost(): Promise<number> {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const result = await prisma.apiLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { estimatedCost: true },
    });
    return result._sum.estimatedCost ?? 0;
  } catch {
    return 0;
  }
}

async function fetchDbStats() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [totalAccounts, newSignups] = await Promise.all([
    prisma.userSettings.count(),
    prisma.userSettings.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);
  return { totalAccounts, newSignupsThisMonth: newSignups };
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PAGE:    React.CSSProperties = { minHeight: "100vh", background: "#f0fafa", padding: "40px 24px", fontFamily: "system-ui, -apple-system, sans-serif" };
const WRAP:    React.CSSProperties = { maxWidth: "980px", margin: "0 auto" };
const CARD:    React.CSSProperties = { background: "white", border: "1px solid #b2ddd9", borderRadius: "12px", padding: "20px" };
const PROFIT:  React.CSSProperties = { background: "#2D9B8A", border: "1px solid #2D9B8A", borderRadius: "12px", padding: "20px" };
const SECTION: React.CSSProperties = { marginBottom: "32px" };
const LABEL:   React.CSSProperties = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2D9B8A", marginBottom: "10px" };
const TABLE:   React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const TH:      React.CSSProperties = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2D9B8A", padding: "6px 0 10px", textAlign: "left", borderBottom: "1px solid #e0f2f1" };
const TH_R:    React.CSSProperties = { ...TH, textAlign: "right" };
const TD:      React.CSSProperties = { fontSize: "13px", padding: "11px 0", color: "#1a2e2b", borderBottom: "1px solid #f0fafa" };
const TD_R:    React.CSSProperties = { ...TD, textAlign: "right" };
const TOTAL:   React.CSSProperties = { fontSize: "13px", fontWeight: 700, padding: "12px 0 4px", color: "#1a2e2b", borderTop: "1px solid #b2ddd9" };
const TOTAL_R: React.CSSProperties = { ...TOTAL, textAlign: "right" };

function Badge({ n }: { n: number }) {
  return (
    <span style={{ marginLeft: "8px", background: "#e0f2f1", color: "#2D9B8A", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>
      {n.toLocaleString()} credits
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || user.id !== process.env.ADMIN_USER_ID) redirect("/");

  const [stripeRes, twilioRes, outscraperRes, serperRes, claudeRes, dbRes] =
    await Promise.allSettled([
      fetchStripe(),
      fetchTwilio(),
      fetchOutscraperCredits(),
      fetchSerperCredits(),
      fetchClaudeCost(),
      fetchDbStats(),
    ]);

  const stripe   = stripeRes.status   === "fulfilled" ? stripeRes.value   : { plans: [], totalMrr: 0, activeSubCount: 0 };
  const twilio   = twilioRes.status   === "fulfilled" ? twilioRes.value   : { smsCount: 0, cost: 0 };
  const outscraper = outscraperRes.status === "fulfilled" ? outscraperRes.value : null;
  const serper   = serperRes.status   === "fulfilled" ? serperRes.value   : null;
  const claude   = claudeRes.status   === "fulfilled" ? claudeRes.value   : 0;
  const db       = dbRes.status       === "fulfilled" ? dbRes.value       : { totalAccounts: 0, newSignupsThisMonth: 0 };

  const variableTotal    = twilio.cost + claude;
  const estimatedProfit  = stripe.totalMrr - FIXED_TOTAL - variableTotal;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={PAGE}>
      <div style={WRAP}>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a2e2b", margin: 0 }}>Vynta Admin</h1>
          <p style={{ fontSize: "12px", color: "#7ba8a4", marginTop: "4px" }}>{dateLabel}</p>
        </div>

        {/* ── Overview row ── */}
        <div style={SECTION}>
          <p style={LABEL}>Overview</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>

            <div style={CARD}>
              <p style={{ fontSize: "10px", color: "#7ba8a4", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>MRR</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1a2e2b", lineHeight: 1 }}>{usd(stripe.totalMrr)}</p>
              <p style={{ fontSize: "11px", color: "#7ba8a4", marginTop: "6px" }}>{stripe.activeSubCount} active sub{stripe.activeSubCount !== 1 ? "s" : ""}</p>
            </div>

            <div style={CARD}>
              <p style={{ fontSize: "10px", color: "#7ba8a4", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Fixed Costs</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1a2e2b", lineHeight: 1 }}>{usd(FIXED_TOTAL)}</p>
              <p style={{ fontSize: "11px", color: "#7ba8a4", marginTop: "6px" }}>per month</p>
            </div>

            <div style={CARD}>
              <p style={{ fontSize: "10px", color: "#7ba8a4", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Variable Costs</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1a2e2b", lineHeight: 1 }}>{usd(variableTotal)}</p>
              <p style={{ fontSize: "11px", color: "#7ba8a4", marginTop: "6px" }}>this month</p>
            </div>

            <div style={PROFIT}>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Est. Profit</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "white", lineHeight: 1 }}>{usd(estimatedProfit)}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>MRR − fixed − variable</p>
            </div>

          </div>
        </div>

        {/* ── Income table ── */}
        <div style={SECTION}>
          <p style={LABEL}>Income — Active Subscriptions</p>
          <div style={CARD}>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Plan</th>
                  <th style={TH_R}>Subscribers</th>
                  <th style={TH_R}>Unit MRR</th>
                  <th style={TH_R}>Total MRR</th>
                </tr>
              </thead>
              <tbody>
                {stripe.plans.length === 0 ? (
                  <tr><td colSpan={4} style={{ ...TD, color: "#7ba8a4", paddingTop: "20px" }}>No active subscriptions yet</td></tr>
                ) : (
                  stripe.plans.map((p) => (
                    <tr key={p.name}>
                      <td style={TD}>{p.name}</td>
                      <td style={TD_R}>{p.count}</td>
                      <td style={TD_R}>{usd(p.unitMrr)}</td>
                      <td style={TD_R}>{usd(p.totalMrr)}</td>
                    </tr>
                  ))
                )}
                <tr>
                  <td colSpan={3} style={TOTAL}>Total MRR</td>
                  <td style={TOTAL_R}>{usd(stripe.totalMrr)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Costs — two columns ── */}
        <div style={{ ...SECTION, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Fixed costs */}
          <div>
            <p style={LABEL}>Fixed Costs</p>
            <div style={CARD}>
              <table style={TABLE}>
                <thead>
                  <tr>
                    <th style={TH}>Item</th>
                    <th style={TH_R}>Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {FIXED_COSTS.map((c) => (
                    <tr key={c.name}>
                      <td style={TD}>{c.name}</td>
                      <td style={TD_R}>{c.cost === 0 ? <span style={{ color: "#b2ddd9" }}>—</span> : usd(c.cost)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={TOTAL}>Total</td>
                    <td style={TOTAL_R}>{usd(FIXED_TOTAL)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Variable costs */}
          <div>
            <p style={LABEL}>Variable Costs — This Month</p>
            <div style={CARD}>
              <table style={TABLE}>
                <thead>
                  <tr>
                    <th style={TH}>Item</th>
                    <th style={TH_R}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={TD}>
                      Twilio SMS
                      <span style={{ marginLeft: "8px", fontSize: "10px", color: "#7ba8a4" }}>
                        {twilio.smsCount.toLocaleString()} msgs
                      </span>
                    </td>
                    <td style={TD_R}>{usd(twilio.cost)}</td>
                  </tr>
                  <tr>
                    <td style={TD}>Claude API</td>
                    <td style={TD_R}>{usd(claude)}</td>
                  </tr>
                  <tr>
                    <td style={TD}>
                      Outscraper
                      {outscraper !== null && <Badge n={outscraper} />}
                    </td>
                    <td style={TD_R}><span style={{ color: "#b2ddd9" }}>$0.00</span></td>
                  </tr>
                  <tr>
                    <td style={TD}>
                      Serper
                      {serper !== null && <Badge n={serper} />}
                    </td>
                    <td style={TD_R}><span style={{ color: "#b2ddd9" }}>$0.00</span></td>
                  </tr>
                  <tr>
                    <td style={TOTAL}>Total</td>
                    <td style={TOTAL_R}>{usd(variableTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── Customers ── */}
        <div style={SECTION}>
          <p style={LABEL}>Customers</p>
          <div style={CARD}>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Metric</th>
                  <th style={TH_R}>Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Total accounts",               value: db.totalAccounts.toLocaleString() },
                  { label: "Active paid subscriptions",    value: stripe.activeSubCount.toLocaleString() },
                  { label: "New signups this month",       value: db.newSignupsThisMonth.toLocaleString() },
                  { label: "Free accounts",                value: Math.max(0, db.totalAccounts - stripe.activeSubCount).toLocaleString() },
                ].map((row) => (
                  <tr key={row.label}>
                    <td style={TD}>{row.label}</td>
                    <td style={TD_R}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
