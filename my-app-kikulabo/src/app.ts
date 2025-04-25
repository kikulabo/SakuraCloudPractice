import express, { Request, Response } from 'express';

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from AppRun! by kikulabo');
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
}); 
