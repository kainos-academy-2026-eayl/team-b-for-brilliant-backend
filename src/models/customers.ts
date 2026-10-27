export interface CustomerCredentials {
  customerID: string;
  passwordHash: string;
  mfaEnabled: boolean;
}

export async function findCustomerByEmail(email: string): Promise<CustomerCredentials | null> {
  const { prisma } = await import('../prismaClient');

  const user = await prisma.user.findUnique({
    where: { email },
    select: { userID: true, passwordHash: true, mfaEnabled: true },
  });

  return user
    ? { customerID: user.userID, passwordHash: user.passwordHash, mfaEnabled: user.mfaEnabled }
    : null;
}
