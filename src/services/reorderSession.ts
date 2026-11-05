import { findReorderItems, type ReorderItem } from '../repositories/reorder';
import { findUsableDiscount, type UsableDiscount } from './discountCodes';
import {
  calculateOrderTotals,
  formatPounds,
  type OrderTotalsDto,
  toPence,
  toTotalsDto,
} from './orderTotals';

export interface ReorderItemDto {
  productID: string;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string | null;
  lineTotal: string | null;
  available: boolean;
  reason: string | null;
}

export interface ReorderSessionDto {
  items: ReorderItemDto[];
  unavailableItems: { productName: string; reason: string }[];
  canCheckOut: boolean;
  totals: OrderTotalsDto | null;
}

function unavailableReason(item: ReorderItem): string | null {
  const { product } = item;

  if (!product.visible || product.draft || product.deletedAt !== null) {
    return 'No longer available';
  }
  if (!product.productPrices[0]) {
    return 'No price available';
  }
  if (product.quantity === 0) {
    return 'Out of stock';
  }
  if (product.quantity < item.quantity) {
    return `Only ${product.quantity} in stock`;
  }
  return null;
}

export function buildReorderSession(
  rows: ReorderItem[],
  discount: UsableDiscount | null,
): ReorderSessionDto {
  let subtotalPence = 0;

  const items = rows.map((row): ReorderItemDto => {
    const reason = unavailableReason(row);
    const price = row.product.productPrices[0]?.price;
    const linePence = price ? toPence(price) * row.quantity : 0;

    if (reason === null) {
      subtotalPence += linePence;
    }

    return {
      productID: row.productID,
      productName: row.product.name,
      imageUrl: row.product.productImages[0]?.imageUrl ?? null,
      quantity: row.quantity,
      unitPrice: price ? formatPounds(toPence(price)) : null,
      lineTotal: price ? formatPounds(linePence) : null,
      available: reason === null,
      reason,
    };
  });

  const canCheckOut = items.some((item) => item.available);

  return {
    items,
    unavailableItems: items
      .filter((item) => !item.available)
      .map((item) => ({ productName: item.productName, reason: item.reason ?? '' })),
    canCheckOut,
    totals: canCheckOut ? toTotalsDto(calculateOrderTotals(subtotalPence, discount)) : null,
  };
}

// Works out what a reorder would cost right now. Nothing is saved and the basket is not read.
export async function getReorderSession(
  customerID: string,
  orderID: string,
  discountCode: string | undefined,
): Promise<ReorderSessionDto> {
  const rows = await findReorderItems(customerID, orderID);
  const discount = discountCode ? await findUsableDiscount(discountCode) : null;

  return buildReorderSession(rows, discount);
}
