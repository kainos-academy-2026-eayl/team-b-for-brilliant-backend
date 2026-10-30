import { type Request, type RequestHandler, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireAdmin } from '../middleware/requireAdmin';
import { deleteDiscount, getDiscounts } from '../services/discounts';

export const discountServices = {
  getDiscounts: () => getDiscounts(),
  deleteDiscount: (discountID: string) => deleteDiscount(discountID),
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
