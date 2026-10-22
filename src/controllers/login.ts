import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { verifyCredentials } from '../services/login';

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(1024),
});

export function createAuthRouter(verify: typeof verifyCredentials = verifyCredentials): Router {
  const router = Router();
  router.post('/verify', async (req: Request, res: Response) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'A valid email and password are required' });
      return;
    }

    try {
      const customer = await verify(parsed.data.email, parsed.data.password);
      if (!customer) {
        res.status(401).json({ error: 'Email or password is incorrect' });
        return;
      }
      res.json(customer);
    } catch (error) {
      console.error('Customer credential verification failed:', error);
      res.status(503).json({ error: 'We could not sign you in right now' });
    }
  });
  return router;
}

export const authRouter = createAuthRouter();
