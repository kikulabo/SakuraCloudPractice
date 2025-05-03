import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const app = express();
const execAsync = promisify(exec);

// ログファイルのパスを設定
const APP_LOG_FILE = '/var/log/app.log';
const ENTRYPOINT_LOG_FILE = '/var/log/entrypoint.log';

// ログを出力する関数
const logMessage = (message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFile(APP_LOG_FILE, logMessage, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
};

app.get('/', async (req: Request, res: Response) => {
  try {
    const { stdout: hostname } = await execAsync('hostname');
    const response = `Hello from AppRun! by kikulabo monitoring\nHostname: ${hostname.trim()}`;
    logMessage(`GET / - Response: ${response}`);
    res.send(response);
  } catch (error) {
    logMessage(`GET / - Error: ${error}`);
    res.status(500).send('Error getting hostname');
  }
});

app.get('/health', (req: Request, res: Response) => {
  logMessage('GET /health - Status: ok');
  res.json({ status: 'ok' });
});

// ログファイルが存在しない場合は作成
if (!fs.existsSync(APP_LOG_FILE)) {
  fs.writeFileSync(APP_LOG_FILE, '');
}

app.listen(8080, () => {
  logMessage('Server is running on port 8080');
  console.log('Server is running on port 8080');
});
