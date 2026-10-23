import { type Request, type Response, Router } from 'express';
import * as z from 'zod';
import { registerSchema, resendSchema, verifyEmailSchema } from '../schemas/registration';
import { registerCustomer, resendVerification, verifyEmail } from '../services/registration';

export const registrationRouter = Router();

const NEUTRAL = { message: 'Check your email to confirm your account' };

registrationRouter.post('/register', async (req: Request, res: Response) => {
  const input = registerSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: 'Invalid details', details: z.flattenError(input.error) });
    return;
  }
  try {
    await registerCustomer(input.data.email, input.data.password);
    res.status(202).json(NEUTRAL);
  } catch {
    console.error('Registration failed'); // never log the body, password or token
    res.status(500).json({ error: 'Something went wrong' });
  }
});

registrationRouter.post('/verify-email', async (req: Request, res: Response) => {
  const input = verifyEmailSchema.safeParse(req.body);
  if (!input.success || !(await verifyEmail(input.data.token))) {
    res.status(400).json({ error: 'This link is invalid or has expired' });
    return;
  }
  res.json({ message: 'Email verified' });
});

registrationRouter.post('/resend-verification', async (req: Request, res: Response) => {
  const input = resendSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  await resendVerification(input.data.email);
  res.status(202).json(NEUTRAL);
});
