import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

const SEED_STOCK: { sku: string; available: number }[] = [
  { sku: 'SKU-1', available: 100 },
  { sku: 'SKU-2', available: 50 },
  { sku: 'SKU-3', available: 0 },
];

async function main(): Promise<void> {
  for (const item of SEED_STOCK) {
    await prisma.stockItem.upsert({
      where: { sku: item.sku },
      create: { sku: item.sku, available: item.available },
      update: { available: item.available },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
