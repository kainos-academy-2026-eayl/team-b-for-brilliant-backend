import { Router } from 'express';
import { HttpError, sendErrorResponse } from '../errors/httpError';
import { requireCustomer } from '../middleware/requireCustomer';
import { listSecurityQuestions } from '../repositories/securityQuestions';
import { accountDetailsSchema } from '../schemas/accountDetails';
import { saveCustomerDetails } from '../services/accountDetails';
import { deleteAccount } from '../services/deleteAccount';

export function createAccountDetailsRouter(
  save = saveCustomerDetails,
  listQuestions = listSecurityQuestions,
  remove = deleteAccount,
): Router {
  const router = Router();
  router.use(requireCustomer);

  router.get('/security-questions', async (_req, res) => {
    try {
      res.json({ questions: await listQuestions() });
    } catch (error) {
      sendErrorResponse(error, res);
    }
  });

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

  router.delete('/', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await remove(res.locals.customerID);
      res.status(204).end();
    } catch (error) {
      if (error instanceof HttpError) {
        sendErrorResponse(error, res);
        return;
      }
      // Only the message is logged. The account is left as it was because the delete is one transaction.
      console.error('Account deletion failed', (error as Error).message);
      res.status(500).json({ error: 'We could not delete your account. Please try again.' });
    }
  });

  return router;
}
