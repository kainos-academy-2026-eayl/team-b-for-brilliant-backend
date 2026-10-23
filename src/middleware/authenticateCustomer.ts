import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getCustomerIDForToken } from '../services/sessions';

export function createAuthenticateCustomer(
  resolveCustomerID: (token: string) => string | null = getCustomerIDForToken,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';

    // Always overwrite so an identity can never come from anywhere except a valid token
    res.locals.customerID = token ? (resolveCustomerID(token) ?? undefined) : undefined;
    next();
  };
}

export const authenticateCustomer = createAuthenticateCustomer();
