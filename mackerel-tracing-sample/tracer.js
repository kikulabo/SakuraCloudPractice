// OpenTelemetry関連モジュールのインポート
const { Resource, processDetector, hostDetector } = require('@opentelemetry/resources');
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
// const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api'); // デバッグログが必要な場合はコメント解除

// デバッグログが必要な場合はコメント解除してレベルを設定
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Resourceクラスが正しくインポートされたか基本的なチェック
if (!Resource || typeof Resource !== 'function') {
  console.error("CRITICAL ERROR: OpenTelemetry Resource class could not be imported. Ensure '@opentelemetry/resources' is installed correctly.");
  process.exit(1);
}

// Mackerelへのトレースエクスポーターの設定
const exporter = new OTLPTraceExporter({
  maxQueueSize: 1000, // キューの最大サイズ
  url: "https://otlp-vaxila.mackerelio.com/v1/traces", // Mackerel OTLP Endpoint
  headers: {
    "Accept": "*/*",
    "Mackerel-Api-Key": process.env.MACKEREL_API_KEY, // 環境変数からAPIキーを取得
  }
});

// カスタムリソース情報を作成
const customResourceAttributes = {
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "mackerel-tracing-sample", // 環境変数も参照
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || "1.0.0", // 環境変数も参照
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.OTEL_DEPLOYMENT_ENVIRONMENT || "production" // 環境変数も参照
};
const resourceInstance = new Resource(customResourceAttributes);

// OpenTelemetry SDK の設定と初期化
let sdk;
try {
  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // fsモジュールの計装は大量のトレースを生成することがあるため、無効化
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        // 必要に応じて他の計装の有効/無効を設定
        // 例: '@opentelemetry/instrumentation-express': { enabled: true }
        // 例: '@opentelemetry/instrumentation-http': { enabled: true }
      }),
    ],
    resource: resourceInstance, // カスタム属性を持つリソース
    // processDetector と hostDetector の結果を自動的にマージ
    resourceDetectors: [processDetector, hostDetector].filter(Boolean)
  });

  // OpenTelemetry SDK の起動
  // sdk.start() が Promise を返さないバージョンもあるため、戻り値はチェックしない
  sdk.start();
  console.log("OpenTelemetry SDK initialized and started.");

} catch (initError) {
  console.error("Failed to initialize OpenTelemetry SDK:", initError);
  process.exit(1); // SDK初期化でエラーがあれば終了
}

// アプリケーション終了シグナルを補足してSDKをシャットダウン
const shutdown = () => {
  console.log("Shutting down OpenTelemetry SDK...");
  if (sdk && typeof sdk.shutdown === 'function') {
    sdk.shutdown() // shutdownはPromiseを返す
      .then(() => console.log('OpenTelemetry SDK shutdown successfully.'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK:', error))
      .finally(() => process.exit(0));
  } else {
    console.log("SDK not available for shutdown. Exiting.");
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// このファイルが直接実行された場合のメッセージ（通常は不要）
if (require.main === module) {
  console.log("Tracer setup complete. Ensure this file is required at the very top of your main application file (e.g., app.js).");
}
