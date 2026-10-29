import { Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireCustomer } from '../middleware/requireCustomer';
import { saveAccountDetails } from '../repositories/accountDetails';
import { accountDetailsSchema } from '../schemas/accountDetails';

export function createAccountDetailsRouter(save = saveAccountDetails): Router {
  const router = Router();
  router.use(requireCustomer);

  router.put('/details', async (req, res) => {
    const input = accountDetailsSchema.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: 'Invalid account details', details: input.error.flatten() });
      return;
    }

    try {
      const result = await save(res.locals.customerID, input.data);
      if (result.count === 0) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      res.status(204).end();
    } catch (error) {
      sendErrorResponse(error, res);
    }
  });

  return router;
}
