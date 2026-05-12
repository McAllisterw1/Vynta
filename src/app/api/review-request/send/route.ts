import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import twilio from "twilio"
import { nanoid } from "nanoid"
import { addDays } from "date-fns"

const resend = new Resend(process.env.RESEND_API_KEY)
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

  if (channel === "EMAIL" || channel === "BOTH") {
    await resend.emails.send({
      from: `${businessName} <reviews@yourdomain.com>`,
      to: email!,
      subject: `How was your experience at ${businessName}?`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #FFFDF7; border-radius: 12px; overflow: hidden;">
          <div style="background: #3D2B1F; padding: 24px 32px;">
            <p style="color: #F5F0E8; font-size: 18px; font-weight: 600; margin: 0;">✦ ${businessName}</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 22px; font-weight: 600; color: #2C1A0F; margin: 0 0 12px;">Hey ${name},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #5C4033; margin: 0 0 24px;">
              We loved having you — and if we hit the mark, we'd be incredibly grateful if you took 60 seconds to leave us a review. It helps other people find us and keeps us on our toes.
            </p>
            <a href="${reviewLink}" style="background: #3D2B1F; color: #F5F0E8; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block;">
              Leave a Google review →
            </a>
            <p style="font-size: 13px; color: #8C7B6B; margin: 16px 0 0;">Takes less than a minute.</p>
          </div>
        </div>
      `
    })
  }

  if (channel === "SMS" || channel === "BOTH") {
    await twilioClient.messages.create({
      body: `Hi ${name}! Thanks for visiting ${businessName}. Would you mind leaving us a quick Google review? It means a lot 🙏 ${reviewLink}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone!
    })
  }

  return NextResponse.json({ success: true, token })
}
