import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { type AuthenticatedUser, getAuthenticatedUserForToken } from '../services/sessions';

export function createAuthenticateCustomer(
  resolveUser: (token: string) => AuthenticatedUser | null = getAuthenticatedUserForToken,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';

    // Always overwrite so an identity can never come from anywhere except a valid token
    const user = token ? resolveUser(token) : null;
    res.locals.customerID = user?.customerID;
    res.locals.accessLevel = user?.accessLevel;
    next();
  };
}

export const authenticateCustomer = createAuthenticateCustomer();
