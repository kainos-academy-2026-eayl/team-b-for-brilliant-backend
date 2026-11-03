export interface OrderItemDto {
  productID: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface OrderDto {
  orderID: string;
  placedAt: string;
  items: OrderItemDto[];
  total: string;
}

export interface OrderRecord {
  orderID: string;
  createdAt: Date;
  orderItems: {
    productID: string;
    quantity: number;
    unitPrice: { toString(): string };
    product: { name: string };
  }[];
}
