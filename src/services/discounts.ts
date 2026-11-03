import type { DiscountDto, DiscountsResponseDto } from '../dtos/discount';
import { HttpError } from '../errors/httpError';
import { toDiscountDto } from '../mappers/discount';
import {
  createDiscountRecord,
  findAllDiscounts,
  updateDiscountExpiry,
} from '../repositories/discounts';
import type { CreateDiscountInput } from '../schemas/discount';

export type DiscountRepository = {
  findAllDiscounts: typeof findAllDiscounts;
  createDiscountRecord: typeof createDiscountRecord;
  updateDiscountExpiry: typeof updateDiscountExpiry;
};

export const discountRepository: DiscountRepository = {
  findAllDiscounts,
  createDiscountRecord,
  updateDiscountExpiry,
};

export async function getDiscounts(
  repo: DiscountRepository = discountRepository,
): Promise<DiscountsResponseDto> {
  const discounts = await repo.findAllDiscounts();
  return { discounts: discounts.map(toDiscountDto) };
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

export async function setDiscountExpiry(
  discountID: string,
  expiryDate: Date,
  repo: DiscountRepository = discountRepository,
): Promise<DiscountDto> {
  const discount = await repo.updateDiscountExpiry(discountID, expiryDate);

  if (!discount) {
    throw new HttpError(404, 'Discount not found');
  }

  return toDiscountDto(discount);
}

export function deactivateDiscount(
  discountID: string,
  repo: DiscountRepository = discountRepository,
): Promise<DiscountDto> {
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  return setDiscountExpiry(discountID, today, repo);
}
