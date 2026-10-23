export interface BasketItemDto {
  basketItemID: string;
  productID: string;
  productName: string;
  quantityInBasket: number;
  stockAvailable: number;
  isQuantityAvailable: boolean;
  lowStock: boolean;
}

export interface BasketDto {
  items: BasketItemDto[];
}
