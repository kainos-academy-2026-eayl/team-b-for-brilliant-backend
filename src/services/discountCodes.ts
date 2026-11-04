import { HttpError } from '../errors/httpError';
import type { Prisma } from '../generated/prisma/client';
import type { DiscountRule } from './orderTotals';

export interface UsableDiscount extends DiscountRule {
  discountID: string;
}

type DiscountClient = Pick<Prisma.TransactionClient, 'discounts'>;

// Checks that a code exists and has not expired
export async function findUsableDiscount(
  code: string,
  client?: DiscountClient,
  now: Date = new Date(),
): Promise<UsableDiscount> {
  const db: DiscountClient = client ?? (await import('../prismaClient')).prisma;

  const discount = await db.discounts.findFirst({
    where: { code: { equals: code.trim(), mode: 'insensitive' } },
  });

  if (!discount) {
    throw new HttpError(400, 'That discount code is not valid');
  }

  if (discount.expiryDate <= now) {
    throw new HttpError(400, 'That discount code has expired');
  }

  return { discountID: discount.discountID, type: discount.type, value: discount.value };
}
