import { PrismaClient } from '@prisma/client'
import { ConvexHttpClient } from "convex/browser";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma client (current)
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Convex client (new)
export const convexHttp = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Migration status flag
export const MIGRATION_MODE = process.env.MIGRATION_MODE || 'PRISMA'; // PRISMA, DUAL, CONVEX

// Database abstraction layer for migration
export const db = {
  // During migration, we can choose which database to use
  usePrisma: () => MIGRATION_MODE === 'PRISMA' || MIGRATION_MODE === 'DUAL',
  useConvex: () => MIGRATION_MODE === 'CONVEX' || MIGRATION_MODE === 'DUAL',
  
  // Helper to get the appropriate client
  getPrismaClient: () => prisma,
  getConvexClient: () => convexHttp,
};
