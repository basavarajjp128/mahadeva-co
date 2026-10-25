import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.APP_DATABASE_URL;
  if (!connectionString) throw new Error("Payment storage is not configured");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}
