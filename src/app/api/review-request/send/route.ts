import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import twilio from "twilio"
import { nanoid } from "nanoid"
import { addDays } from "date-fns"
import { auth } from "@clerk/nextjs/server"

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { businessId, name, email, phone, channel, platformUrl, businessName } = await req.json()

    console.log("[review-request/send] payload:", { businessId, name, email, phone, channel, platformUrl, businessName })

    const token = nanoid(21)
    const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/review/${token}`

    console.log("[review-request/send] creating DB record...")
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
    console.log("[review-request/send] DB record created, sending SMS...")

    await twilioClient.messages.create({
      body: `Hi ${name}! Thanks for visiting ${businessName}. Would you mind leaving us a quick Google review? It means a lot 🙏 ${reviewLink}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone!
    })
    console.log("[review-request/send] SMS sent successfully")

    return NextResponse.json({ success: true, token })
  } catch (err) {
    console.error("[review-request/send] ERROR:", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
