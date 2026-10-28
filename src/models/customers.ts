export interface CustomerCredentials {
  customerID: string;
  passwordHash: string;
}

export async function findCustomerByEmail(email: string): Promise<CustomerCredentials | null> {
  const { prisma } = await import('../prismaClient');

  const user = await prisma.user.findUnique({
    where: { email },
    select: { userID: true, passwordHash: true },
  });

  return user ? { customerID: user.userID, passwordHash: user.passwordHash } : null;
}
