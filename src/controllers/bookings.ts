import { type Request, type Response, Router } from 'express';

export const bookingsRouter = Router();

bookingsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ bookings: [] });
});
