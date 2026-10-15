import { Router, type Request, type Response } from 'express';

export const bookingsRouter = Router();

bookingsRouter.get('/', (_req: Request, res: Response) => {
    res.json({ bookings: [] });
});