import { EventConsumer, EventPublisher, OutboxRelay, buildServer, logger } from '@bjm/shared';
import { env } from './config/env';
import { prisma } from './config/database';
import { kafka } from './config/kafka';
import { buildExampleModule } from './modules/example/example.module';

async function main(): Promise<void> {
  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: env.KAFKA_GROUP_ID });
  await producer.connect();
  await consumer.connect();

  const publisher = new EventPublisher(producer, env.SERVICE_NAME);
  const module = buildExampleModule();

  const relay = new OutboxRelay(module.outboxPort, publisher, { intervalMs: 1000 });
  const eventConsumer = new EventConsumer(consumer, producer, module.idempotency);
  await eventConsumer.run(module.consumerHandlers);
  relay.start();

  const app = await buildServer({
    routes: module.routes,
    readiness: [
      {
        name: 'postgres',
        check: async () => {
          await prisma.$queryRaw`SELECT 1`;
          return true;
        },
      },
    ],
    openapi: {
      title: 'Example Service API',
      description: 'Plantilla de microservicio (clean architecture + Kafka + outbox).',
      version: '0.1.0',
    },
  });

  await app.listen({ host: '0.0.0.0', port: env.PORT });
  logger.info({ port: env.PORT }, `${env.SERVICE_NAME} escuchando`);

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'apagando');
    relay.stop();
    await consumer.disconnect();
    await producer.disconnect();
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'error fatal al arrancar');
  process.exit(1);
});
