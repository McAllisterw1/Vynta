import Stripe from 'stripe'
import { clerkClient } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function updateUserPlan(
  userId: string,
  plan: string,
  subscriptionId: string,
  subscriptionStatus: string,
  trialEnd?: number | null,
) {
  const clerk = await clerkClient()
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { plan, subscriptionId, subscriptionStatus, trialEnd: trialEnd ?? null },
  })
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      const subscriptionId = session.subscription as string

      if (!userId || !plan || !subscriptionId) break

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      await updateUserPlan(userId, plan, subscriptionId, subscription.status, subscription.trial_end)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId
      const plan = subscription.metadata?.plan

      if (!userId || !plan) break
      await updateUserPlan(userId, plan, subscription.id, subscription.status, subscription.trial_end)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (!userId) break
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { plan: null, subscriptionId: null, subscriptionStatus: 'canceled', paymentFailed: false },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const parent = invoice.parent
      if (parent?.type !== 'subscription_details') break
      const sub = parent.subscription_details?.subscription
      const subId = typeof sub === 'string' ? sub : sub?.id
      if (!subId) break

      const subscription = await stripe.subscriptions.retrieve(subId)
      const userId = subscription.metadata?.userId
      if (!userId) break

      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { paymentFailed: true },
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const parent = invoice.parent
      if (parent?.type !== 'subscription_details') break
      const sub = parent.subscription_details?.subscription
      const subId = typeof sub === 'string' ? sub : sub?.id
      if (!subId) break

      const subscription = await stripe.subscriptions.retrieve(subId)
      const userId = subscription.metadata?.userId
      if (!userId) break

      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { paymentFailed: false },
      })
      break
    }
  }

  return Response.json({ received: true })
}
