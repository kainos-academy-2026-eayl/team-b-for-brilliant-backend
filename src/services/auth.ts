import { findCustomerByEmail } from '../models/customers';
import { comparePasswords } from './password';

export type VerifyCredentialsResult =
  | { status: 'valid'; customerId: string; accessLevel: 0 | 1 }
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

  return {
    status: 'valid',
    customerId: customer.customerID,
    accessLevel: customer.accessLevel === 1 ? 1 : 0,
  };
}

export async function uniqueEmail(
  email: string,
  findCustomer: typeof findCustomerByEmail = findCustomerByEmail,
): Promise<UniqueEmailResult> {
  const customer = await findCustomer(email.trim().toLowerCase());
  return { unique: customer === null };
}
