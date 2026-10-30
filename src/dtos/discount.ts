export type DiscountTypeDto = 'PERCENTAGE' | 'AMOUNT_OFF';

export interface DiscountDto {
  discountID: string;
  code: string;
  type: DiscountTypeDto;
  value: string;
  expiryDate: string;
}

export interface DiscountsResponseDto {
  discounts: DiscountDto[];
}
