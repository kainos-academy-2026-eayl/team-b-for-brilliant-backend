import { HttpError } from '../errors/httpError';
import { deleteCustomerAccount } from '../repositories/deleteAccount';
import { revokeSessionsForCustomer } from './sessions';

export async function deleteAccount(
  customerID: string,
  remove = deleteCustomerAccount,
  revokeSessions = revokeSessionsForCustomer,
): Promise<void> {
  const removed = await remove(customerID);

  if (removed === 0) {
    throw new HttpError(404, 'Account not found');
  }

  // Tokens are stateless, so every one this customer holds must stop working immediately
  revokeSessions(customerID);
}
