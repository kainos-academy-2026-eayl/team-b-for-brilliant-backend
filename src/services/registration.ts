import { createCustomer } from '../repositories/registration';
import { hashPassword } from '../utils/password';

export async function registerCustomer(
  email: string,
  password: string,
  create: typeof createCustomer = createCustomer,
) {
  const passwordHash = await hashPassword(password); // done even for existing emails so timing looks the same
  await create(email, passwordHash);
}
