import { type Request, type RequestHandler, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireAdmin } from '../middleware/requireAdmin';
import { type CreateDiscountInput, validateCreateDiscount } from '../schemas/discount';
import { createDiscount, deleteDiscount, getDiscounts } from '../services/discounts';

export const discountServices = {
  getDiscounts: () => getDiscounts(),
  deleteDiscount: (discountID: string) => deleteDiscount(discountID),
  createDiscount: (input: CreateDiscountInput) => createDiscount(input),
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

  router.delete('/:discountID', async (req: Request<{ discountID: string }>, res: Response) => {
    try {
      await services.deleteDiscount(req.params.discountID);
      res.status(204).end();
    } catch (error) {
      sendErrorResponse(error, res);
    }
  });

  return router;
}
