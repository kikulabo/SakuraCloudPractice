// tracer.js を最初に読み込み、トレーシングを初期化
// MACKEREL_API_KEY が設定されていればトレーシングが開始されます。
require('./tracer');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  console.log('Request received for /');
  res.send('Hello World from Mackerel Tracing Sample!');
});

app.get('/hello', async (req, res) => {
  const name = req.query.name || 'Anonymous';
  console.log(`Request received for /hello with name: ${name}`);

  // 非同期処理のシミュレーション
  await new Promise(resolve => setTimeout(resolve, 150));

  res.send(`Hello, ${name}! This request should be traced.`);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  if (!process.env.MACKEREL_API_KEY) {
    console.warn("Reminder: MACKEREL_API_KEY is not set. Traces won't be sent to Mackerel.");
  }
  if (process.env.OTEL_SERVICE_NAME) {
    console.log(`Service name for tracing: ${process.env.OTEL_SERVICE_NAME}`);
  } else {
    console.log(`Service name for tracing (default): my-nodejs-app`);
  }
});
