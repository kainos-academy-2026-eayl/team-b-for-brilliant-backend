import { findCustomerByEmail } from '../repositories/customers';
import { hashPassword, verifyPassword } from './passwords';

let dummyHash: Promise<string> | undefined;

export async function verifyCredentials(
  email: string,
  password: string,
  findCustomer: typeof findCustomerByEmail = findCustomerByEmail,
): Promise<{ customerId: string } | null> {
  const customer = await findCustomer(email);
  // Still perform a password check for unknown emails.
  if (!customer && !dummyHash) {
    dummyHash = hashPassword('unused-dummy-password');
  }
  const passwordHash = customer ? customer.passwordHash : await dummyHash;
  if (!passwordHash) {
    throw new Error('Password verification hash is unavailable');
  }
  const matches = await verifyPassword(password, passwordHash);
  return customer && matches ? { customerId: customer.customerId } : null;
}
