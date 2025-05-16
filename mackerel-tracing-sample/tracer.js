const { Resource, processDetector, hostDetector } = require('@opentelemetry/resources');
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { ParentBasedSampler, TraceIdRatioBased } = require('@opentelemetry/sdk-trace-base');

// デバッグモードの設定
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// サンプリングレートの設定（デフォルト: 1.0 = 100%）
const SAMPLING_RATIO = parseFloat(process.env.SAMPLING_RATIO || '1.0');

const exporter = new OTLPTraceExporter({
  maxQueueSize: 1000,
  url: "https://otlp-vaxila.mackerelio.com/v1/traces",
  headers: {
    "Accept": "*/*",
    "Mackerel-Api-Key": process.env.MACKEREL_API_KEY,
  }
});

// デバッグ時にはConsoleSpanExporterが便利
const consoleExporter = DEBUG_MODE ? new ConsoleSpanExporter() : null;

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (request) => {
          // ヘルスチェックなどの特定のパスを無視
          return request.url?.includes('/health');
        },
      },
    }),
  ],
  resource: Resource.default().merge(new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "acme_service",
    [SemanticResourceAttributes.SERVICE_VERSION]: "vX.Y.Z",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "production"
  })),
  resourceDetectors: [processDetector, hostDetector],
  // サンプリング設定
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBased(SAMPLING_RATIO),
  }),
  // デバッグモード時の設定
  ...(DEBUG_MODE && {
    spanProcessor: new SimpleSpanProcessor(consoleExporter),
  }),
});

// トレースIDの表示設定
if (DEBUG_MODE) {
  const { trace } = require('@opentelemetry/api');
  const tracer = trace.getTracer('debug-tracer');

  // トレースIDをログに出力する関数
  const logTraceId = (span) => {
    console.log(`Trace ID: ${span.spanContext().traceId}`);
  };

  // グローバルにトレースIDログ関数を公開
  global.logTraceId = logTraceId;
}

sdk.start();
