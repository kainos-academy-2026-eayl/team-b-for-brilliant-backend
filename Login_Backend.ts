import { randomUUID } from "node:crypto";
import express, { Request, Response } from "express";

interface User {
  email: string;
  password: string;
}

interface LoginRequest {
  email?: string;
  password?: string;
}

interface LoginAttempts {
  failedCount: number;
  lockedUntil: number | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const users: User[] = [
  { email: "alice@example.com", password: "password123" },
  { email: "bob@example.com", password: "letmein123" },
];

// Keyed by email. Unknown emails are tracked too, so attackers can't tell
// which emails are registered by watching which ones get locked.
const loginAttempts = new Map<string, LoginAttempts>();

// Maps each active session token to the email of the user it belongs to.
const sessions = new Map<string, string>();

export function resetLoginAttempts(): void {
  loginAttempts.clear();
}

export function resetSessions(): void {
  sessions.clear();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function findUser(email: string, password: string): User | undefined {
  return users.find((u) => u.email === email && u.password === password);
}

export function getBearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim() || null;
}

export function createSession(email: string): string {
  const token = randomUUID();
  sessions.set(token, email);
  return token;
}

export function endSession(token: string): boolean {
  return sessions.delete(token);
}

export function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email);
}

export function isLockedOut(email: string): boolean {
  const attempts = loginAttempts.get(email);
  if (!attempts || attempts.lockedUntil === null) {
    return false;
  }
  if (Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(email);
    return false;
  }
  return true;
}

export function recordFailedAttempt(email: string): void {
  const attempts = loginAttempts.get(email) ?? { failedCount: 0, lockedUntil: null };
  attempts.failedCount += 1;
  if (attempts.failedCount >= MAX_FAILED_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(email, attempts);
}

const app = express();
app.use(express.json());

app.post("/login", (req: Request<object, object, LoginRequest>, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email address is not valid" });
  }

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
  }

  if (isLockedOut(email)) {
    return res.status(429).json({ error: "Too many failed attempts. Please try again later." });
  }

  const user = findUser(email, password);

  if (!user) {
    recordFailedAttempt(email);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  clearFailedAttempts(email);
  const token = createSession(user.email);

  return res.json({ message: "Login successful", token });
});

app.post("/logout", (req: Request, res: Response) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token || !endSession(token)) {
    return res.status(401).json({ error: "Not logged in" });
  }

  return res.json({ message: "Logged out" });
});

if (require.main === module) {
  app.listen(3000, () => console.log("Listening on http://localhost:3000"));
}

export default app;
