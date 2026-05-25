import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createClient()
}

export const prisma = globalForPrisma.prisma
