import { type Request, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireCustomer } from '../middleware/requireCustomer';
import { checkout } from '../services/checkout';

export const checkoutRouter = Router();

checkoutRouter.use(requireCustomer);

checkoutRouter.post('/', async (_req: Request, res: Response) => {
  try {
    const order = await checkout(res.locals.customerID);
    res.status(201).json(order);
  } catch (error) {
    sendErrorResponse(error, res);
  }
});
