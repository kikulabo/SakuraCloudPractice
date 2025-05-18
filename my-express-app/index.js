const express = require('express');
const app = express();

const hostname = '127.0.0.1';
const port = 3000;

app.get('/', (_req, res) => {
  res.send('Hello from Node.js with Express on Sakura Cloud!\n');
});

// 意図的にエラーを発生させるパスを追加
app.get('/testerror', (_req, res) => {
  try {
    throw new Error('This is a test error for Mackerel log monitoring!');
  } catch (error) {
    console.error(`Error on /testerror path: ${error.message}`);
    res.status(500).send('An intentional error occurred on the server.');
  }
});

app.listen(port, hostname, () => {
  console.log(`Server running with Express at http://${hostname}:${port}/`);
});
