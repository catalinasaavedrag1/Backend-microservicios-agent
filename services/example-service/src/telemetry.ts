/**
 * Arranque opcional de OpenTelemetry. Se activa solo si está definido
 * `OTEL_EXPORTER_OTLP_ENDPOINT`, de modo que no añade overhead cuando no se usa.
 *
 * Para máxima fidelidad de auto-instrumentación, este módulo se importa el
 * primero en `main.ts` (antes que Fastka/Kafka/PG). En producción también puedes
 * precargarlo con `node -r ./dist/telemetry.js dist/main.js`.
 */
type Sdk = { shutdown: () => Promise<void> };

let sdk: Sdk | undefined;

export async function startTelemetry(serviceName: string): Promise<void> {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
  process.env.OTEL_SERVICE_NAME ??= serviceName;

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');

  const instance = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  instance.start();
  sdk = instance;
}

export async function shutdownTelemetry(): Promise<void> {
  await sdk?.shutdown();
}
