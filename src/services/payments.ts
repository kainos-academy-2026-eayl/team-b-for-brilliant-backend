import { HttpError } from '../errors/httpError';

export interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface PaymentResult {
  status: 'PAID';
  last4: string;
}

const APPROVED_TEST_CARD = '4242424242424242';

// Simulated payment: no real money moves and no external provider is called.
// The full card number and CVV are never stored or logged.
export async function processPayment(card: CardDetails): Promise<PaymentResult> {
  if (card.cardNumber !== APPROVED_TEST_CARD) {
    throw new HttpError(402, 'Your card was declined');
  }

  return { status: 'PAID', last4: card.cardNumber.slice(-4) };
}
