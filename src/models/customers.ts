export interface CustomerCredentials {
  customerID: string;
  passwordHash: string | null;
  accessLevel: number | null;
}

export async function findCustomerByEmail(email: string): Promise<CustomerCredentials | null> {
  const { prisma } = await import('../prismaClient');

  const user = await prisma.user.findUnique({
    where: { email },
    select: { userID: true, passwordHash: true, role: { select: { accessLevel: true } } },
  });

  return user
    ? {
        customerID: user.userID,
        passwordHash: user.passwordHash,
        accessLevel: user.role?.accessLevel ?? 0,
      }
    : null;
}
