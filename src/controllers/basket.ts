import { type Request, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireCustomer } from '../middleware/requireCustomer';
import { validateAddBasketItem, validateUpdateBasketItem } from '../schemas/basket';
import {
  addToBasket,
  getBasket,
  removeFromBasket,
  setBasketItemQuantity,
} from '../services/basket';

export const basketRouter = Router();

basketRouter.use(requireCustomer);

basketRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const basket = await getBasket(res.locals.customerID);
    res.json(basket);
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

basketRouter.post('/items', async (req: Request, res: Response) => {
  const input = validateAddBasketItem(req.body);

  if (!input.success) {
    res.status(400).json({ error: 'Invalid basket item', details: input.errors });
    return;
  }

  try {
    const item = await addToBasket(
      res.locals.customerID,
      input.data.productID,
      input.data.quantity,
    );
    res.status(201).json({ item });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

basketRouter.patch(
  '/items/:productID',
  async (req: Request<{ productID: string }>, res: Response) => {
    const input = validateUpdateBasketItem(req.body);

    if (!input.success) {
      res.status(400).json({ error: 'Invalid quantity', details: input.errors });
      return;
    }

    try {
      const item = await setBasketItemQuantity(
        res.locals.customerID,
        req.params.productID,
        input.data.quantity,
      );
      res.json({ item });
    } catch (error) {
      sendErrorResponse(error, res);
    }
  },
);

basketRouter.delete(
  '/items/:productID',
  async (req: Request<{ productID: string }>, res: Response) => {
    try {
      await removeFromBasket(res.locals.customerID, req.params.productID);
      res.status(204).end();
    } catch (error) {
      sendErrorResponse(error, res);
    }
  },
);
