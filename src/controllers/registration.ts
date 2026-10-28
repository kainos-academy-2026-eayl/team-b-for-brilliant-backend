import { type Request, type Response, Router } from 'express';
import * as z from 'zod';
import { registerSchema } from '../schemas/registration';
import { registerCustomer } from '../services/registration';

export function createRegistrationRouter(register: typeof registerCustomer = registerCustomer) {
  const router = Router();
  router.post('/register', async (req: Request, res: Response) => {
    const input = registerSchema.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: 'Invalid details', details: z.flattenError(input.error) });
      return;
    }
    try {
      await register(input.data.email, input.data.password);
      res.status(202).json({ message: 'Registration request processed' });
    } catch {
      console.error('Registration failed'); // never log the body or password
      res.status(500).json({ error: 'Something went wrong' });
    }
  });
  return router;
}

export const registrationRouter = createRegistrationRouter();
