import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes';
import { ApiError } from './utils/apiError';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

app.use('/api', router);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    console.warn(`[Error] ${req.method} ${req.path} → ${err.statusCode} ${err.message}`);
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }
  console.error(`[Error] 未預期錯誤 ${req.method} ${req.path}:`, err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
