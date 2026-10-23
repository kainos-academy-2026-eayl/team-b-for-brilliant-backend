import type { Prisma } from '../generated/prisma/client';

// Row lock held until the surrounding transaction ends, so only one basket change or checkout
// per customer runs at a time. Other requests for the same customer wait here.
export async function lockCustomer(tx: Prisma.TransactionClient, customerID: string) {
  await tx.$queryRaw`SELECT "customerID" FROM "Customer" WHERE "customerID" = ${customerID} FOR UPDATE`;
}
