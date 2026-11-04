export interface BasketItemDto {
  basketItemID: string;
  productID: string;
  productName: string;
  imageUrl: string | null;
  unitPrice: string | null;
  lineTotal: string | null;
  quantityInBasket: number;
  stockAvailable: number;
  isQuantityAvailable: boolean;
  lowStock: boolean;
}

export interface BasketDto {
  items: BasketItemDto[];
  notices: string[];
}
