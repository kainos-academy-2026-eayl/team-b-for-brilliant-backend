import type { AccountDetails } from '../schemas/accountDetails';

export async function saveAccountDetails(customerID: string, details: AccountDetails) {
  const { prisma } = await import('../prismaClient');
  return prisma.user.updateMany({
    where: { userID: customerID },
    data: {
      firstname: details.firstname || null,
      surname: details.surname || null,
      addressLine1: details.addressLine1 || null,
      addressLine2: details.addressLine2 || null,
      postcode: details.postcode || null,
    },
  });
}
