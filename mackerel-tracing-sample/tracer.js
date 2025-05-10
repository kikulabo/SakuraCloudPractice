'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Mackerel OTLPエンドポイント
const MACKEREL_OTLP_ENDPOINT = 'https://otlp.mackerelio.com/v1/traces';

// 環境変数からMackerel APIキーとサービス名を取得
const MACKEREL_API_KEY = process.env.MACKEREL_API_KEY;
const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'my-nodejs-app';

// SDKを初期化して起動する関数
function initializeTracing() {
  if (!MACKEREL_API_KEY) {
    console.warn(
      'MACKEREL_API_KEY environment variable is not set. Traces will not be sent to Mackerel.'
    );
    // APIキーがない場合はトレーシングを初期化しない、またはローカル出力などに切り替えることも可能
    return null;
  }

  // Mackerel OTLPエクスポーターの設定
  const traceExporter = new OTLPTraceExporter({
    url: MACKEREL_OTLP_ENDPOINT,
    headers: {
      'Mackerel-Api-Key': MACKEREL_API_KEY,
    },
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: OTEL_SERVICE_NAME,
      // 必要に応じて他のリソース属性を追加
      //例: [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
    }),
    traceExporter,
    instrumentations: [
      new HttpInstrumentation(), // HTTPクライアント/サーバーの自動計装
      new ExpressInstrumentation(), // Expressフレームワークの自動計装
    ],
  });

  // SDKの起動
  sdk
    .start()
    .then(() => {
      console.log(`Tracing initialized successfully for service: ${OTEL_SERVICE_NAME}`);
      console.log(`Traces will be sent to Mackerel: ${MACKEREL_OTLP_ENDPOINT}`);
    })
    .catch((error) => console.error('Error initializing tracing:', error));

  // アプリケーション終了時にSDKをシャットダウン
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing:', error))
      .finally(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing:', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

// トレーシングを初期化
const sdk = initializeTracing();

// 他のファイルからSDKインスタンスにアクセスしたい場合はエクスポート
module.exports = sdk;
