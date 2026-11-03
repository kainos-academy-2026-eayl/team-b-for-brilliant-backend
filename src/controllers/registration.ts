import { type Request, type Response, Router } from 'express';
import * as z from 'zod';
import { registerSchema } from '../schemas/registration';
import { registerCustomer } from '../services/registration';
import { createSession } from '../services/sessions';

export function createRegistrationRouter(register: typeof registerCustomer = registerCustomer) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.post('/register', async (req: Request, res: Response) => {
    const input = registerSchema.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: 'Invalid details', details: z.flattenError(input.error) });
      return;
    }
    try {
      const customer = await register(input.data.email, input.data.password);
      if (customer) {
        res.status(202).json({
          message: 'Registration request processed',
          customerId: customer.customerID,
          accessLevel: 0,
          accessToken: createSession(customer.customerID),
        });
      } else {
        res.status(202).json({ message: 'Registration request processed' });
      }
    } catch {
      console.error('Registration failed'); // never log the body or password
      res.status(500).json({ error: 'Something went wrong' });
    }
  });
  return router;
}

export const registrationRouter = createRegistrationRouter();
