import express, { type Express, type Request, type Response } from 'express';
import { bookingsRouter } from './controllers/bookings';
import { loginRouter } from './controllers/login';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/bookings', bookingsRouter);
  app.use(loginRouter);
  return app;
}


