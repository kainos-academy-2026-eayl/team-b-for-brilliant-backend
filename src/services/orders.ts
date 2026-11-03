import type { OrderDto, OrderRecord } from '../dtos/orders';
import { findOrdersForCustomer } from '../repositories/orders';

export const ordersRepository = {
  findOrdersForCustomer,
};

export type OrdersRepository = typeof ordersRepository;

function toPence(price: string): number {
  return Math.round(Number(price) * 100);
}

function formatPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

export function toOrderDto(order: OrderRecord): OrderDto {
  const items = order.orderItems.map((item) => {
    const linePence = toPence(item.unitPrice.toString()) * item.quantity;

    return {
      productID: item.productID,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: formatPounds(toPence(item.unitPrice.toString())),
      lineTotal: formatPounds(linePence),
    };
  });
  const totalPence = items.reduce((sum, item) => sum + toPence(item.lineTotal), 0);

  return {
    orderID: order.orderID,
    placedAt: order.createdAt.toISOString(),
    items,
    total: formatPounds(totalPence),
  };
}

export async function getOrders(
  customerID: string,
  repo: OrdersRepository = ordersRepository,
): Promise<OrderDto[]> {
  const orders = await repo.findOrdersForCustomer(customerID);

  return orders.map(toOrderDto);
}
