import { PrismaClient } from "@prisma/client";

// Evita múltiplas conexões em dev com hot-reload (Next.js/ts-node recarregam o módulo a cada mudança).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
