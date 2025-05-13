const { Resource, processDetector, hostDetector } = require('@opentelemetry/resources');
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const exporter = new OTLPTraceExporter({
  maxQueueSize: 1000,
  url: "https://otlp-vaxila.mackerelio.com/v1/traces",
  headers: {
    "Accept": "*/*",
    "Mackerel-Api-Key": process.env.MACKEREL_API_KEY,
  }
});
// デバッグ時にはConsoleSpanExporterが便利
// const exporter = new ConsoleSpanExporter()

const sdk = new NodeSDK({
  traceExporter: exporter,
  // 修正点: "instrumentations:" の重複を削除
  instrumentations: [
    getNodeAutoInstrumentations({
      // fsの計装はスタートアップ時に大量のトレースを作り出すので、必要がなければ外したほうが便利です。
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
  resource: Resource.default().merge(new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "acme_service",
    [SemanticResourceAttributes.SERVICE_VERSION]: "vX.Y.Z",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "production"
  })),
  resourceDetectors: [processDetector, hostDetector]
});

sdk.start();
