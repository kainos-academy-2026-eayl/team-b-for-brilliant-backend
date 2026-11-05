// Returns how many accounts were cleared (0 when the customer does not exist or is already deleted)
export async function deleteCustomerAccount(userID: string): Promise<number> {
  const { prisma } = await import('../prismaClient');

  return prisma.$transaction(async (transaction) => {
    // The User row and the orders stay so order history is kept. Orders keep their own delivery
    // details. Everything that identifies the customer or lets them sign in is cleared.
    const result = await transaction.user.updateMany({
      where: { userID, email: { not: null } },
      data: {
        email: null,
        passwordHash: null,
        firstname: null,
        surname: null,
        addressLine1: null,
        addressLine2: null,
        postcode: null,
        roleID: null,
        securityQuestionID: null,
        securityAnswer: null,
      },
    });

    if (result.count === 0) {
      return 0;
    }

    await transaction.basket.deleteMany({ where: { userID } });

    return result.count;
  });
}
