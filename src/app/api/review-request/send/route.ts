import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import twilio from "twilio"
import { nanoid } from "nanoid"
import { addDays } from "date-fns"

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: NextRequest) {
  const { businessId, name, email, phone, channel, platformUrl, businessName } = await req.json()

  const token = nanoid(21)
  const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/review/${token}`

  await prisma.reviewRequest.create({
    data: {
      token,
      businessId,
      name,
      email,
      phone,
      channel,
      platformUrl,
      sentAt: new Date(),
      expiresAt: addDays(new Date(), 30)
    }
  })

  await twilioClient.messages.create({
    body: `Hi ${name}! Thanks for visiting ${businessName}. Would you mind leaving us a quick Google review? It means a lot 🙏 ${reviewLink}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone!
  })

  return NextResponse.json({ success: true, token })
}
