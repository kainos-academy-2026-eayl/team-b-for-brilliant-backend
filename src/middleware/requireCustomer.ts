import type { NextFunction, Request, Response } from 'express';

// The login code should set res.locals.customerID before this runs.
export function requireCustomer(_req: Request, res: Response, next: NextFunction): void {
  if (typeof res.locals.customerID !== 'string') {
    res.status(401).json({ error: 'Login required' });
    return;
  }
  next();
}
