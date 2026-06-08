import { createKafka } from '@bjm/shared';
import { env } from './env';

export const kafka = createKafka({ clientId: env.KAFKA_CLIENT_ID, brokers: env.KAFKA_BROKERS });
