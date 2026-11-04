export const DELIVERY_CHARGE_PENCE = 399;

export interface DiscountRule {
  type: 'PERCENTAGE' | 'AMOUNT_OFF';
  value: { toString(): string };
}

export interface OrderTotals {
  subtotalPence: number;
  discountPence: number;
  deliveryPence: number;
  totalPence: number;
}

export interface OrderTotalsDto {
  subtotal: string;
  discount: string;
  delivery: string;
  total: string;
}

export function toPence(price: { toString(): string }): number {
  return Math.round(Number(price.toString()) * 100);
}

export function formatPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

// All maths is done in whole pence so decimal rounding errors cannot creep into money
export function calculateOrderTotals(
  subtotalPence: number,
  discount: DiscountRule | null,
): OrderTotals {
  let discountPence = 0;

  if (discount?.type === 'PERCENTAGE') {
    discountPence = Math.round((subtotalPence * Number(discount.value.toString())) / 100);
  } else if (discount?.type === 'AMOUNT_OFF') {
    discountPence = toPence(discount.value);
  }

  // A discount can take the items down to £0 but never below
  discountPence = Math.min(Math.max(discountPence, 0), subtotalPence);

  const deliveryPence = subtotalPence > 0 ? DELIVERY_CHARGE_PENCE : 0;

  return {
    subtotalPence,
    discountPence,
    deliveryPence,
    totalPence: subtotalPence - discountPence + deliveryPence,
  };
}

export function toTotalsDto(totals: OrderTotals): OrderTotalsDto {
  return {
    subtotal: formatPounds(totals.subtotalPence),
    discount: formatPounds(totals.discountPence),
    delivery: formatPounds(totals.deliveryPence),
    total: formatPounds(totals.totalPence),
  };
}
