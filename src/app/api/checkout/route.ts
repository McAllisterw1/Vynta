import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'
import { PLANS } from '@/lib/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { plan } = await request.json()
  const { userId } = await auth()
  const origin = new URL(request.url).origin

  if (plan === 'starter') {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PLANS.starter.priceId, quantity: 1 }],
      metadata: { plan, ...(userId && { userId }) },
      subscription_data: { trial_period_days: 14, metadata: { plan, ...(userId && { userId }) } },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    })
    return Response.json({ url: session.url })
  }

  if (plan === 'professional' || plan === 'agency') {
    // Annual — use pre-created Stripe yearly price ID from plans.ts
    const priceId =
      plan === 'professional'
        ? PLANS.professional.yearlyPriceId
        : PLANS.agency.yearlyPriceId

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan, ...(userId && { userId }) },
      subscription_data: { trial_period_days: 14, metadata: { plan, ...(userId && { userId }) } },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    })
    return Response.json({ url: session.url })
  }

  return Response.json({ error: 'Invalid plan' }, { status: 400 })
}
