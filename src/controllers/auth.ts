import { json, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { type UniqueEmailResult, type VerifyCredentialsResult, verifyCredentials, uniqueEmail } from '../services/auth';

const verifyBodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});
  
const emailBodySchema = z.object({
  email: z.string().min(1),
});

export const authServices = {
  verifyCredentials: (email: string, password: string) => verifyCredentials(email, password),
  uniqueEmail: (email: string) => uniqueEmail(email),
};

export function createAuthRouter(
  services: {
    verifyCredentials: (email: string, password: string) => Promise<VerifyCredentialsResult>;
    uniqueEmail: (email: string) => Promise<UniqueEmailResult>;
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
        res.json({ customerId: result.customerId });
    }
  });

  router.post('/unique-email', async (req: Request, res: Response) => {
    const body = emailBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    const result = await services.uniqueEmail(body.data.email);

    if (result.unique) {
      res.json({ unique: true });
    }
    else {
      res.json({ unique: false });
    }
  })

  return router;
}
