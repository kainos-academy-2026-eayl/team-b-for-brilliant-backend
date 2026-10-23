import { findCustomerByEmail } from '../models/customers';
import { verifyPassword } from '../utils/password';

export type VerifyCredentialsResult =
  | { status: 'valid'; customerId: string; mfaEnabled: boolean }
  | { status: 'invalid' }
  | { status: 'not_found' };

export async function verifyCredentials(
  email: string,
  password: string,
  findCustomer: typeof findCustomerByEmail = findCustomerByEmail,
): Promise<VerifyCredentialsResult> {
  const customer = await findCustomer(email.trim());
  if (customer === null) return { status: 'not_found' };

  if (!(await verifyPassword(password, customer.passwordHash))) return { status: 'invalid' };

  return { status: 'valid', customerId: customer.customerID, mfaEnabled: customer.mfaEnabled };
}
