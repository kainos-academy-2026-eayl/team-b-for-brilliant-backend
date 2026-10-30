import { findCustomerByEmail } from '../models/customers';
import { comparePasswords } from './password';

export type VerifyCredentialsResult =
  | { status: 'valid'; customerId: string }
  | { status: 'invalid' }
  | { status: 'not_found' };

export type UniqueEmailResult = { unique: boolean };

export async function verifyCredentials(
  email: string,
  password: string,
  findCustomer: typeof findCustomerByEmail = findCustomerByEmail,
): Promise<VerifyCredentialsResult> {
  const customer = await findCustomer(email.trim().toLowerCase());
  if (customer === null) return { status: 'not_found' };

  if (!(await comparePasswords(password, customer.passwordHash))) return { status: 'invalid' };

  return { status: 'valid', customerId: customer.customerID };
}

export async function uniqueEmail(
  email: string,
  findCustomer: typeof findCustomerByEmail = findCustomerByEmail,
): Promise<UniqueEmailResult> {
  const customer = await findCustomer(email.trim().toLowerCase());
  return { unique: customer === null };
}
