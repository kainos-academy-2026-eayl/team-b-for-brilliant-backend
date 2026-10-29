import { type Request, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireCustomer } from '../middleware/requireCustomer';
import { getOrders } from '../services/orders';

export const ordersRouter = Router();

ordersRouter.use(requireCustomer);

ordersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    res.json({ orders: await getOrders(res.locals.customerID) });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});
