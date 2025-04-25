const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from AppRun! by kikulabo');
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
