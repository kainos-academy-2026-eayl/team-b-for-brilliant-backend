import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { findRoleNameForUser } from '../repositories/userRoles';

export const ADMIN_ROLE_NAME = 'admin';

// Must run after authenticateCustomer, which sets res.locals.customerID from a valid session.
export function createRequireAdmin(
  findRoleName: (userID: string) => Promise<string | null> = findRoleNameForUser,
): RequestHandler {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (typeof res.locals.customerID !== 'string') {
      res.status(401).json({ error: 'Login required' });
      return;
    }

    const roleName = await findRoleName(res.locals.customerID);

    if (roleName?.toLowerCase() !== ADMIN_ROLE_NAME) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  };
}

export const requireAdmin = createRequireAdmin();
