import { type CompletedCheckout, completeCheckout } from '../repositories/checkout';
import type { CheckoutInput } from '../schemas/checkout';

export async function checkout(
  customerID: string,
  input: CheckoutInput,
  complete: typeof completeCheckout = completeCheckout,
): Promise<CompletedCheckout> {
  return complete(customerID, input);
}
