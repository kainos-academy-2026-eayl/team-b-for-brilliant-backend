import { type Request, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireCustomer } from '../middleware/requireCustomer';
import { validateCheckout, validateQuote, validateReorderSession } from '../schemas/checkout';
import { checkout } from '../services/checkout';
import { getQuote } from '../services/checkoutQuote';
import { getReorderSession } from '../services/reorderSession';

export const checkoutRouter = Router();

checkoutRouter.use(requireCustomer);

checkoutRouter.post('/reorder-session', async (req: Request, res: Response) => {
  const input = validateReorderSession(req.body);

  if (!input.success) {
    res.status(400).json({ error: 'Invalid request', details: { fieldErrors: input.fieldErrors } });
    return;
  }

  try {
    res.json(
      await getReorderSession(res.locals.customerID, input.data.orderID, input.data.discountCode),
    );
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

checkoutRouter.post('/quote', async (req: Request, res: Response) => {
  const input = validateQuote(req.body);

  if (!input.success) {
    res.status(400).json({ error: 'Invalid request', details: { fieldErrors: input.fieldErrors } });
    return;
  }

  try {
    res.json(await getQuote(res.locals.customerID, input.data.discountCode));
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

checkoutRouter.post('/', async (req: Request, res: Response) => {
  const input = validateCheckout(req.body);

  if (!input.success) {
    res
      .status(400)
      .json({ error: 'Invalid checkout details', details: { fieldErrors: input.fieldErrors } });
    return;
  }

  try {
    const order = await checkout(res.locals.customerID, input.data);
    res.status(201).json(order);
  } catch (error) {
    sendErrorResponse(error, res);
  }
});
