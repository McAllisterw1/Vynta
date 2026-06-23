import Stripe from 'stripe'
import { auth, clerkClient } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const subscriptionId = user.publicMetadata?.subscriptionId as string | undefined

  if (!subscriptionId) {
    return Response.json({ error: 'No active subscription found' }, { status: 400 })
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = subscription.customer as string

  const origin = new URL(request.url).origin
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/settings`,
  })

  return Response.json({ url: session.url })
}
