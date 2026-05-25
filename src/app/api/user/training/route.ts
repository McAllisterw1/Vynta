import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const training = await prisma.trainingProgress.findUnique({ where: { userId } });
  return NextResponse.json(training);
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    profile?: Prisma.InputJsonValue;
    completed?: boolean[];
    content?: (string | null)[];
  };

  const data: Prisma.TrainingProgressUpdateInput = {};
  if (body.profile !== undefined) data.profile = body.profile;
  if (body.completed !== undefined) data.completed = body.completed as Prisma.InputJsonValue;
  if (body.content !== undefined) data.content = body.content as Prisma.InputJsonValue;

  const training = await prisma.trainingProgress.upsert({
    where: { userId },
    create: {
      userId,
      profile: body.profile ?? Prisma.JsonNull,
      completed: (body.completed ?? Array(7).fill(false)) as Prisma.InputJsonValue,
      content: (body.content ?? Array(7).fill(null)) as Prisma.InputJsonValue,
    },
    update: data,
  });

  return NextResponse.json(training);
}
