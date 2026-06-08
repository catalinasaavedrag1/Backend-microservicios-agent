import { PrismaClient } from '../../prisma/generated/client';

/**
 * Única instancia del cliente Prisma del servicio. Este es el único módulo que
 * importa el cliente generado directamente; el resto depende de los ports de
 * repositorio.
 */
export const prisma = new PrismaClient();
export type { PrismaClient };
export { Prisma } from '../../prisma/generated/client';
