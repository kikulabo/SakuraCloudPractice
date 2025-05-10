// OpenTelemetry関連モジュールのインポート
const { DiagConsoleLogger, DiagLogLevel, diag } = require('@opentelemetry/api');
const { Resource, processDetector, hostDetector } = require('@opentelemetry/resources');
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// OpenTelemetryの内部診断ログを有効化 (DEBUGレベルで詳細情報を出力)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

console.log("--- OpenTelemetry Tracer Setup ---");

// Log installed OpenTelemetry package versions for easier debugging
try {
  const apiPkg = require('@opentelemetry/api/package.json');
  console.log(`Using @opentelemetry/api version: ${apiPkg.version}`);
  const sdkNodePkg = require('@opentelemetry/sdk-node/package.json');
  console.log(`Using @opentelemetry/sdk-node version: ${sdkNodePkg.version}`);
  const resourcesPkg = require('@opentelemetry/resources/package.json');
  console.log(`Using @opentelemetry/resources version: ${resourcesPkg.version}`);
  const autoInstrPkg = require('@opentelemetry/auto-instrumentations-node/package.json');
  console.log(`Using @opentelemetry/auto-instrumentations-node version: ${autoInstrPkg.version}`);
  const exporterProtoPkg = require('@opentelemetry/exporter-trace-otlp-proto/package.json');
  console.log(`Using @opentelemetry/exporter-trace-otlp-proto version: ${exporterProtoPkg.version}`);

} catch (e) {
  console.warn("Could not log some OpenTelemetry package versions.", e);
}


// 1. インポートされたモジュールの確認
console.log("1. Checking imported OpenTelemetry modules:");
console.log("   'Resource' constructor:", Resource ? 'Available' : 'Unavailable');
console.log("   'processDetector':", processDetector ? 'Available' : 'Unavailable');
console.log("   'hostDetector':", hostDetector ? 'Available' : 'Unavailable');

if (!Resource || typeof Resource !== 'function') {
  console.error("CRITICAL ERROR: 'Resource' class could not be imported correctly. Exiting.");
  process.exit(1);
}
console.log("---");

// Mackerelへのトレースエクスポーターの設定
const exporter = new OTLPTraceExporter({
  maxQueueSize: 1000,
  url: "https://otlp-vaxila.mackerelio.com/v1/traces", // Mackerel OTLP Endpoint
  headers: {
    "Accept": "*/*",
    "Mackerel-Api-Key": process.env.MACKEREL_API_KEY, // APIキーを環境変数から取得
  }
});
console.log("Exporter configured for Mackerel.");

// カスタムリソース情報を作成
const customResourceAttributes = {
  [SemanticResourceAttributes.SERVICE_NAME]: "mackerel-tracing-sample",
  [SemanticResourceAttributes.SERVICE_VERSION]: "v1.0.0",
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "production"
};
console.log("2. Custom resource attributes defined:", customResourceAttributes);

const resourceInstance = new Resource(customResourceAttributes);
console.log("   Created resourceInstance with custom attributes.");
console.log("---");

// OpenTelemetry SDK の設定
console.log("3. Initializing NodeSDK...");
let sdk;
try {
  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // fsモジュールの計装はスタートアップ時に大量のトレースを生成することがあるため、無効化
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        // 必要に応じて他の計装の有効/無効を設定
        // 例: '@opentelemetry/instrumentation-express': { enabled: true }
      }),
    ],
    resource: resourceInstance,
    resourceDetectors: [processDetector, hostDetector].filter(Boolean) // undefinedの可能性を排除
  });
  console.log("   NodeSDK object initialized.");
  if (sdk && typeof sdk.start === 'function') {
    console.log("   sdk.start method is available.");
  } else {
    console.error("   ERROR: sdk.start is NOT a function or sdk is not properly initialized!");
    // SDKが正しく初期化されなかった場合、ここで終了することも検討
  }
} catch (initError) {
  console.error("   ERROR during NodeSDK initialization:", initError);
  process.exit(1); // SDK初期化でエラーがあれば終了
}
console.log("---");

// OpenTelemetry SDK の起動
console.log("4. Starting OpenTelemetry SDK...");
if (sdk && typeof sdk.start === 'function') {
  try {
    const startReturnValue = sdk.start();
    console.log("   sdk.start() called.");

    // sdk.start() が Promise を返すか確認
    if (startReturnValue && typeof startReturnValue.then === 'function') {
      console.log("   sdk.start() returned a Promise. Attaching .then() and .catch().");
      startReturnValue
        .then(() => {
          console.log("OpenTelemetry SDK started successfully (Promise resolved).");
        })
        .catch((error) => {
          console.error("Error starting OpenTelemetry SDK (Promise rejected):", error);
          // Diagログが有効なら、ここに至る前にもっと詳細なエラーが出ている可能性あり
          // SDKの起動がクリティカルで失敗した場合、終了を検討
          // process.exit(1);
        });
    } else {
      console.warn("   WARNING: sdk.start() did not return a Promise. Proceeding, as tracing might still work based on previous logs.");
      // Diagログで非同期エラーを確認することが重要です。
      // この場合でも、SDKの他の部分は機能している可能性があるため、アプリケーションは続行します。
    }
  } catch (syncStartError) {
    console.error("   ERROR synchronously thrown by sdk.start():", syncStartError);
    // 同期エラーが発生した場合、SDKは起動していない可能性が高い
    process.exit(1);
  }
} else {
  console.error("   ERROR: Cannot call sdk.start() because sdk or sdk.start is invalid. SDK might not be initialized.");
  process.exit(1);
}
console.log("--- OpenTelemetry Tracer Setup Complete ---");

// アプリケーション終了シグナルを補足してSDKをシャットダウン
const shutdown = () => {
  console.log("Shutting down OpenTelemetry SDK...");
  if (sdk && typeof sdk.shutdown === 'function') {
    sdk.shutdown() // shutdownはPromiseを返す
      .then(() => console.log('OpenTelemetry SDK shutdown successfully.'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK:', error))
      .finally(() => process.exit(0));
  } else {
    console.log("SDK not available or shutdown method missing. Exiting.");
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// このファイルが直接実行された場合に、app.jsを読み込む（サンプル用）
// 実際には、このトレーサー設定をapp.jsの先頭でrequireする
if (require.main === module) {
  console.log("Tracer setup complete. If this is your main app, start your application logic here or require this file at the top of your main app.");
  // 例: require('./app'); // もしapp.jsが別ファイルの場合
}
