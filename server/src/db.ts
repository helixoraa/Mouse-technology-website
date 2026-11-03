import { PrismaClient } from '@prisma/client';

/** Singleton: cached on globalThis so serverless invocations / dev reloads reuse one client. */
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();
globalForPrisma.__prisma = prisma;
