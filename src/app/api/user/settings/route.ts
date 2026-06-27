import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Partial<{
    businessName: string;
    businessType: string;
    businessAddress: string;
    businessUrl: string;
    businessPhone: string;
    googleReviewUrl: string;
    defaultTone: string;
    messageTemplate: string;
    onboardingComplete: boolean;
    googleRating: number;
    avgCustomerValue: number;
    monthlyNewCustomers: number;
    googleTrafficPercent: number;
    targetRating: number;
    repeatCustomersPerYear: number;
    grossMarginPercent: number;
  }>;

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...body },
    update: body,
  });

  return NextResponse.json(settings);
}
