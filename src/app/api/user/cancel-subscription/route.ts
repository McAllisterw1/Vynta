import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const subscriptionId = user.publicMetadata?.subscriptionId as string | undefined;

  if (!subscriptionId) {
    return Response.json({ error: "No active subscription found" }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;

  return Response.json({
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd,
  });
}
