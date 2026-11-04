import { HttpError } from '../errors/httpError';
import { createCustomer } from '../repositories/registration';
import { hashPassword } from '../services/password';

export async function registerCustomer(
  email: string,
  password: string,
  create: typeof createCustomer = createCustomer,
) {
  const passwordHash = await hashPassword(password);
  const customer = await create(email, passwordHash);
  if (customer === null) {
    throw new HttpError(400, "Invalid details");
  }
}
