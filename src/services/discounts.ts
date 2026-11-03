import type { DiscountDto, DiscountsResponseDto } from '../dtos/discount';
import { HttpError } from '../errors/httpError';
import { toDiscountDto } from '../mappers/discount';
import {
  createDiscountRecord,
  deleteDiscountByID,
  findAllDiscounts,
} from '../repositories/discounts';
import type { CreateDiscountInput } from '../schemas/discount';

export type DiscountRepository = {
  findAllDiscounts: typeof findAllDiscounts;
  deleteDiscountByID: typeof deleteDiscountByID;
  createDiscountRecord: typeof createDiscountRecord;
};

export const discountRepository: DiscountRepository = {
  findAllDiscounts,
  deleteDiscountByID,
  createDiscountRecord,
};

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

export async function createDiscount(
  input: CreateDiscountInput,
  repo: DiscountRepository = discountRepository,
): Promise<DiscountDto> {
  const discount = await repo.createDiscountRecord(input);

  if (!discount) {
    throw new HttpError(409, 'A discount with this code already exists');
  }

  return toDiscountDto(discount);
}
