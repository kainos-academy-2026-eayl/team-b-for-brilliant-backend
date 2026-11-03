import type { OrderRecord } from '../dtos/orders';

export async function findOrdersForCustomer(userID: string): Promise<OrderRecord[]> {
  const { prisma } = await import('../prismaClient');

  return prisma.order.findMany({
    where: { userID },
    orderBy: [{ createdAt: 'desc' }, { orderID: 'desc' }],
    select: {
      orderID: true,
      createdAt: true,
      orderItems: {
        select: {
          productID: true,
          quantity: true,
          unitPrice: true,
          product: { select: { name: true } },
        },
      },
    },
  });
}
