import { completeCheckout } from '../repositories/checkout';

export async function checkout(
  customerID: string,
  complete: typeof completeCheckout = completeCheckout,
): Promise<{ orderID: string }> {
  return complete(customerID);
}
