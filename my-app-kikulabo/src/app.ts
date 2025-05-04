import express, { Request, Response } from 'express';

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from AppRun! by kikulabo');
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
