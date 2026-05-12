import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"

interface Props {
  params: { token: string }
}

export default async function ReviewPage({ params }: Props) {
  const request = await prisma.reviewRequest.findUnique({
    where: { token: params.token }
  })

  if (!request || request.expiresAt < new Date()) return notFound()

  await prisma.reviewRequest.update({
    where: { id: request.id },
    data: { clickedAt: request.clickedAt ?? new Date() }
  })

  redirect(request.platformUrl)
}
