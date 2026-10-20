import express, { type Express, type Request, type Response } from 'express';
import { bookingsRouter } from './controllers/bookings';

export function createApp(): Express {
  const app = express();

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/bookings', bookingsRouter);
  return app;
}
