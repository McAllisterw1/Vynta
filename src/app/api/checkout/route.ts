import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PLANS = {
  starter: { label: 'Vynta Starter', amount: 14900 },
  growth:  { label: 'Vynta Growth',  amount: 19900 },
  agency:  { label: 'Vynta Agency',  amount: 39900 },
} as const

export async function POST(request: Request) {
  const { plan } = await request.json()
  const planData = PLANS[plan as keyof typeof PLANS]

  if (!planData) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const { userId } = await auth()
  const origin = new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: planData.label },
          unit_amount: planData.amount,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    metadata: { plan, ...(userId && { userId }) },
    subscription_data: {
      metadata: { plan, ...(userId && { userId }) },
    },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/#pricing`,
  })

  return Response.json({ url: session.url })
}
