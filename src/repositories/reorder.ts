import { HttpError } from '../errors/httpError';
import type { Prisma } from '../generated/prisma/client';

const reorderProductInclude = {
    productImages: { orderBy: { imageOrder: 'asc' }, take: 1 },
    productPrices: { orderBy: [{ createdAt: 'desc' }, { priceID: 'desc' }], take: 1 },
} satisfies Prisma.ProductInclude;

type ReorderClient = Pick<Prisma.TransactionClient, 'orderItem'>;

export type ReorderItem = Prisma.OrderItemGetPayload<{
    include: { product: { include: typeof reorderProductInclude; }; };
}>;

// Only the customer's own completed orders can be reordered
export async function findReorderItems(
    userID: string,
    orderID: string,
    client?: ReorderClient,
): Promise<ReorderItem[]> {
    const db: ReorderClient = client ?? (await import('../prismaClient')).prisma;

    const items = await db.orderItem.findMany({
        where: { orderID, order: { userID, paymentStatus: 'PAID' } },
        include: { product: { include: reorderProductInclude } },
        orderBy: { orderItemID: 'asc' },
    });

    if (items.length === 0) {
        throw new HttpError(404, 'Order not found');
    }

    return items;
}
