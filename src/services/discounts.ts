import type { DiscountsResponseDto } from '../dtos/discount';
import { HttpError } from '../errors/httpError';
import { toDiscountDto } from '../mappers/discount';
import { deleteDiscountByID, findAllDiscounts } from '../repositories/discounts';

export type DiscountRepository = {
  findAllDiscounts: typeof findAllDiscounts;
  deleteDiscountByID: typeof deleteDiscountByID;
};

export const discountRepository: DiscountRepository = { findAllDiscounts, deleteDiscountByID };

export async function getDiscounts(
  repo: DiscountRepository = discountRepository,
): Promise<DiscountsResponseDto> {
  const discounts = await repo.findAllDiscounts();
  return { discounts: discounts.map(toDiscountDto) };
}

export async function deleteDiscount(
  discountID: string,
  repo: DiscountRepository = discountRepository,
): Promise<void> {
  const result = await repo.deleteDiscountByID(discountID);

  if (result.count === 0) {
    throw new HttpError(404, 'Discount not found');
  }
}
