import { PrismaClient } from '../../prisma/generated/client';

export const prisma = new PrismaClient();
export type { PrismaClient };
export { Prisma } from '../../prisma/generated/client';
