const express = require('express');
const app = express();

const hostname = '127.0.0.1';
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from Node.js with Express on Sakura Cloud!\n');
});

app.listen(port, hostname, () => {
  console.log(`Server running with Express at http://${hostname}:${port}/`);
});
