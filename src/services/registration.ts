import {
  consumeVerificationToken,
  createCustomer,
  findUnverifiedCustomerByEmail,
  saveVerificationToken,
} from '../repositories/registration';
import { hashPassword } from '../utils/password';
import { createVerificationToken, hashToken } from '../utils/verificationToken';
import { consoleEmailSender, type EmailSender } from './emailSender';

const verifyUrl = () => `${process.env.FRONTEND_URL ?? 'http://localhost:8000'}/verify-email`;

async function sendLink(customerID: string, email: string, send: EmailSender) {
  const { token, tokenHash, expiresAt } = createVerificationToken();
  await saveVerificationToken(customerID, tokenHash, expiresAt);
  await send(email, `${verifyUrl()}?token=${token}`);
}

export async function registerCustomer(
  email: string,
  password: string,
  send: EmailSender = consoleEmailSender,
) {
  const passwordHash = await hashPassword(password); // done even for existing emails so timing looks the same
  const customer = await createCustomer(email, passwordHash);
  if (!customer) return; // already registered: do nothing and say nothing
  await sendLink(customer.customerID, email, send);
}

export async function verifyEmail(token: string): Promise<boolean> {
  return consumeVerificationToken(hashToken(token));
}

export async function resendVerification(email: string, send: EmailSender = consoleEmailSender) {
  const customer = await findUnverifiedCustomerByEmail(email);
  if (customer) await sendLink(customer.customerID, email, send);
}
