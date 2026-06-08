import { PrismaClient } from '../../prisma/generated/client';

/**
 * Single Prisma client instance for the service. This is the only module that
 * imports the generated client directly; everything else depends on the
 * repository ports.
 */
export const prisma = new PrismaClient();
export type { PrismaClient };
export { Prisma } from '../../prisma/generated/client';
