export interface CustomerCredentials {
  customerID: string;
  passwordHash: string;
  mfaEnabled: boolean;
}

export async function findCustomerByEmail(email: string): Promise<CustomerCredentials | null> {
  const { prisma } = await import('../prismaClient');

  return prisma.customer.findUnique({
    where: { email },
    select: { customerID: true, passwordHash: true, mfaEnabled: true },
  });
}
