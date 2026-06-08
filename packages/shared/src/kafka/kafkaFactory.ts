import { Kafka, logLevel } from 'kafkajs';

export interface KafkaFactoryOptions {
  clientId: string;
  brokers: string[];
}

/** Creates a configured Kafka client with sane connection retry defaults. */
export function createKafka(options: KafkaFactoryOptions): Kafka {
  return new Kafka({
    clientId: options.clientId,
    brokers: options.brokers,
    logLevel: logLevel.NOTHING,
    retry: { retries: 8, initialRetryTime: 300 },
  });
}
