import Stripe from 'stripe'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { PLANS } from '@/lib/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { plan, interval = 'annual' } = await request.json() as { plan: string; interval?: 'annual' | 'monthly' }
    const { userId } = await auth()
    const origin = new URL(request.url).origin

    let customerEmail: string | undefined
    if (userId) {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      customerEmail = user.emailAddresses[0]?.emailAddress
    }

    const planData = PLANS[plan as keyof typeof PLANS]
    if (!planData || !('annualPriceId' in planData)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = interval === 'monthly' ? planData.monthlyPriceId : planData.annualPriceId

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_collection: 'always',
      ...(customerEmail && { customer_email: customerEmail }),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan, interval, ...(userId && { userId }) },
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan, interval, ...(userId && { userId }) },
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
