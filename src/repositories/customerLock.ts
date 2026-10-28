import type { Prisma } from '../generated/prisma/client';

// Row lock held until the surrounding transaction ends, so only one basket change or checkout
// per customer runs at a time. Other requests for the same customer wait here.
export async function lockCustomer(transaction: Prisma.TransactionClient, userID: string) {
  await transaction.$queryRaw`SELECT "userID" FROM "User" WHERE "userID" = ${userID} FOR UPDATE`;
}
