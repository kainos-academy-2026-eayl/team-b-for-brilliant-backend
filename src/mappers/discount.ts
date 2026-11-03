import type { DiscountDto } from '../dtos/discount';
import type { Discounts } from '../generated/prisma/client';

export function toDiscountDto(discount: Discounts): DiscountDto {
  return {
    discountID: discount.discountID,
    code: discount.code,
    type: discount.type,
    value: discount.value.toFixed(2),
    expiryDate: discount.expiryDate.toISOString(),
  };
}
