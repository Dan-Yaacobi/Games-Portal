import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(routes);
  app.use(errorHandler);

  return app;
}
