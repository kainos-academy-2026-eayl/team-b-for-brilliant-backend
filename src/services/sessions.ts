import { randomBytes } from 'node:crypto';

const SESSION_TTL_MS = 60 * 60 * 1000;

const sessions = new Map<string, { customerID: string; expiresAt: number }>();

// Call this from the login code after the customer's password has been verified.
export function createSession(customerID: string, now: number = Date.now()): string {
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, { customerID, expiresAt: now + SESSION_TTL_MS });
  return token;
}

export function getCustomerIDForToken(token: string, now: number = Date.now()): string | null {
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= now) {
    sessions.delete(token);
    return null;
  }

  return session.customerID;
}

export function endSession(token: string): boolean {
  return sessions.delete(token);
}
