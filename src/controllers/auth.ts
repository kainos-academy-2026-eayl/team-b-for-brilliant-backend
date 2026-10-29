import { json, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { type VerifyCredentialsResult, verifyCredentials } from '../services/auth';
import { createSession } from '../services/sessions';

const verifyBodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const authServices = {
  verifyCredentials: (email: string, password: string) => verifyCredentials(email, password),
};

export function createAuthRouter(
  services: {
    verifyCredentials: (email: string, password: string) => Promise<VerifyCredentialsResult>;
  } = authServices,
): Router {
  const router = Router();
  router.use(json());

  router.post('/verify', async (req: Request, res: Response) => {
    const body = verifyBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const result = await services.verifyCredentials(body.data.email, body.data.password);

    switch (result.status) {
      case 'not_found':
        res.status(404).json({ error: 'Customer not found' });
        return;
      case 'invalid':
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      case 'valid':
        // TEMPORARY (KAN-98): issues an API token until login is reworked
        res.json({ customerId: result.customerId, token: createSession(result.customerId) });
    }
  });

  return router;
}
