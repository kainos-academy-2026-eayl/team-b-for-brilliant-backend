import { type Request, type Response, Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { requireCustomer } from '../middleware/requireCustomer';
import { validateUpdateProfile } from '../schemas/profile';
import { getProfile, updateProfile } from '../services/profile';

export const profileRouter = Router();

profileRouter.use(requireCustomer);

profileRouter.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(await getProfile(res.locals.customerID));
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

profileRouter.put('/', async (req: Request, res: Response) => {
  const input = validateUpdateProfile(req.body);

  if (!input.success) {
    res.status(400).json({ error: 'Invalid profile', details: input.errors });
    return;
  }

  try {
    res.json(await updateProfile(res.locals.customerID, input.data));
  } catch (error) {
    sendErrorResponse(error, res);
  }
});
