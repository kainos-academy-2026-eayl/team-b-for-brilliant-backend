import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const TOKEN_TTL_SECONDS = 24 * 60 * 60;
const TOKEN_ISSUER = 'brilliant-backend';
const TOKEN_AUDIENCE = 'brilliant-client';
const revokedTokens = new Map<string, number>();
const revokedCustomers = new Set<string>();

export type AccessLevel = 0 | 1;

export interface AuthenticatedUser {
  customerID: string;
  accessLevel: AccessLevel;
}

function signingSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }
  return secret;
}

function verifyToken(token: string, now: number): JwtPayload | null {
  const secret = signingSecret();
  for (const [tokenID, expiresAt] of revokedTokens) {
    if (expiresAt <= now / 1000) revokedTokens.delete(tokenID);
  }
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      clockTimestamp: Math.floor(now / 1000),
    });
    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      !payload.sub.trim() ||
      (payload.accessLevel !== 0 && payload.accessLevel !== 1) ||
      typeof payload.exp !== 'number' ||
      typeof payload.jti !== 'string' ||
      !payload.jti ||
      revokedTokens.has(payload.jti) ||
      revokedCustomers.has(payload.sub)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createSession(
  customerID: string,
  now: number = Date.now(),
  accessLevel: number | null = 0,
): string {
  const issuedAt = Math.floor(now / 1000);
  return jwt.sign(
    {
      accessLevel: accessLevel === 1 ? 1 : 0,
      iat: issuedAt,
      exp: issuedAt + TOKEN_TTL_SECONDS,
    },
    signingSecret(),
    {
      algorithm: 'HS256',
      subject: customerID,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      jwtid: randomUUID(),
    },
  );
}

export function getAuthenticatedUserForToken(
  token: string,
  now: number = Date.now(),
): AuthenticatedUser | null {
  const payload = verifyToken(token, now);
  if (!payload?.sub || (payload.accessLevel !== 0 && payload.accessLevel !== 1)) return null;
  return { customerID: payload.sub, accessLevel: payload.accessLevel };
}

export function getCustomerIDForToken(token: string, now: number = Date.now()): string | null {
  return getAuthenticatedUserForToken(token, now)?.customerID ?? null;
}

// Used when an account is deleted, so tokens already issued to it are rejected
export function revokeSessionsForCustomer(customerID: string): void {
  revokedCustomers.add(customerID);
}

export function endSession(token: string): boolean {
  const payload = verifyToken(token, Date.now());
  if (!payload?.jti || payload.exp === undefined) return false;
  revokedTokens.set(payload.jti, payload.exp);
  return true;
}
