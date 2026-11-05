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
  subtotal: string;
  discount: string;
  delivery: string;
  total: string;
  canReorder: boolean;
}

export interface OrderRecord {
  orderID: string;
  createdAt: Date;
  paymentStatus?: string | null;
  deliveryCharge?: { toString(): string } | null;
  discountAmount?: { toString(): string } | null;
  orderItems: {
    productID: string;
    quantity: number;
    unitPrice: { toString(): string };
    product: { name: string };
  }[];
}
