import Stripe from 'stripe'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { PLANS } from '@/lib/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { plan } = await request.json()
    const { userId } = await auth()
    const origin = new URL(request.url).origin

    let customerEmail: string | undefined
    if (userId) {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      customerEmail = user.emailAddresses[0]?.emailAddress
    }

    const sharedParams = {
      mode: 'subscription' as const,
      payment_method_collection: 'always' as const,
      ...(customerEmail && { customer_email: customerEmail }),
      metadata: { plan: plan as string, ...(userId && { userId }) },
      subscription_data: { trial_period_days: 14, metadata: { plan: plan as string, ...(userId && { userId }) } },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    }

    if (plan === 'starter') {
      const session = await stripe.checkout.sessions.create({
        ...sharedParams,
        line_items: [{ price: PLANS.starter.yearlyPriceId, quantity: 1 }],
      })
      return Response.json({ url: session.url })
    }

    if (plan === 'professional' || plan === 'agency') {
      const priceId = plan === 'professional'
        ? PLANS.professional.yearlyPriceId
        : PLANS.agency.yearlyPriceId

      const session = await stripe.checkout.sessions.create({
        ...sharedParams,
        line_items: [{ price: priceId, quantity: 1 }],
      })
      return Response.json({ url: session.url })
    }

    return Response.json({ error: 'Invalid plan' }, { status: 400 })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
