import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const APP_LOG_FILE = '/var/log/app.log';

function writeLog(level: string, message: string, metadata: Record<string, any> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: metadata && Object.keys(metadata).length > 0
      ? `${message} | ${JSON.stringify(metadata)}`
      : message
  };

  fs.appendFileSync(APP_LOG_FILE, JSON.stringify(logEntry) + '\n');
}

app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    // /healthエンドポイントへのアクセスはログを出力しない
    if (req.path !== '/health') {
      const duration = Date.now() - start;
      writeLog('info', 'Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }
  });

  next();
});

app.get('/', (req: Request, res: Response) => {
  writeLog('info', 'Access to root endpoint');
  res.send('Hello from AppRun! by kikulabo');
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  writeLog('error', 'Unhandled error occurred', {
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(8080, () => {
  writeLog('info', 'Server started', { port: 8080 });
});
