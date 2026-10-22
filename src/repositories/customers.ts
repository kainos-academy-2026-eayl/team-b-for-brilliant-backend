export async function findCustomerByEmail(email: string) {
  const { prisma } = await import('../prismaClient');
  return prisma.customer.findUnique({
    where: { email },
    select: { customerId: true, passwordHash: true },
  });
}
