import { type Request, type RequestHandler, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  type CreateDiscountInput,
  validateActivateDiscount,
  validateCreateDiscount,
} from '../schemas/discount';
import {
  createDiscount,
  deactivateDiscount,
  getDiscounts,
  setDiscountExpiry,
} from '../services/discounts';

export const discountServices = {
  getDiscounts: () => getDiscounts(),
  createDiscount: (input: CreateDiscountInput) => createDiscount(input),
  deactivateDiscount: (discountID: string) => deactivateDiscount(discountID),
  activateDiscount: (discountID: string, expiryDate: Date) =>
    setDiscountExpiry(discountID, expiryDate),
};

export function createDiscountsRouter(
  services = discountServices,
  adminOnly: RequestHandler = requireAdmin,
): Router {
  const router = Router();

  router.use(adminOnly);

  router.get('/', async (_req: Request, res: Response) => {
    res.json(await services.getDiscounts());
  });

  router.post('/', async (req: Request, res: Response) => {
    const input = validateCreateDiscount(req.body);

    if (!input.success) {
      res.status(400).json({ error: 'Invalid discount', details: input.errors });
      return;
    }

    try {
      res.status(201).json(await services.createDiscount(input.data));
    } catch (error) {
      sendErrorResponse(error, res);
    }
  });

  router.post(
    '/:discountID/deactivate',
    async (req: Request<{ discountID: string }>, res: Response) => {
      try {
        res.json(await services.deactivateDiscount(req.params.discountID));
      } catch (error) {
        sendErrorResponse(error, res);
      }
    },
  );

  router.post(
    '/:discountID/activate',
    async (req: Request<{ discountID: string }>, res: Response) => {
      const input = validateActivateDiscount(req.body);

      if (!input.success) {
        res.status(400).json({ error: 'Invalid discount', details: input.errors });
        return;
      }

      try {
        res.json(await services.activateDiscount(req.params.discountID, input.expiryDate));
      } catch (error) {
        sendErrorResponse(error, res);
      }
    },
  );

  return router;
}
