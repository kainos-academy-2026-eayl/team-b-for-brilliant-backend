import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = (await deriveKey(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const match = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(storedHash);
  if (!match?.[1] || !match[2]) {
    throw new Error('Customer password hash has an unsupported format');
  }
  const key = (await deriveKey(password, match[1], 64)) as Buffer;
  return timingSafeEqual(key, Buffer.from(match[2], 'hex'));
}
