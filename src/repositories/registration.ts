import { Prisma } from '../generated/prisma/client';

// Returns null when the email already exists (also covers two simultaneous sign-ups)
export async function createCustomer(email: string, passwordHash: string) {
  const { prisma } = await import('../prismaClient');
  try {
    return await prisma.customer.create({
      data: { email, passwordHash },
      select: { customerID: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}

export async function findUnverifiedCustomerByEmail(email: string) {
  const { prisma } = await import('../prismaClient');
  return prisma.customer.findFirst({
    where: { email, emailVerified: false },
    select: { customerID: true },
  });
}

// One live token per customer: a new one replaces the old one
export async function saveVerificationToken(
  customerID: string,
  tokenHash: string,
  expiresAt: Date,
) {
  const { prisma } = await import('../prismaClient');
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { customerID } }),
    prisma.emailVerificationToken.create({ data: { customerID, tokenHash, expiresAt } }),
  ]);
}

// Returns true only if the token was valid, unused and not expired
export async function consumeVerificationToken(tokenHash: string): Promise<boolean> {
  const { prisma } = await import('../prismaClient');
  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.emailVerificationToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return false;

    const token = await transaction.emailVerificationToken.findUniqueOrThrow({
      where: { tokenHash },
    });
    await transaction.customer.update({
      where: { customerID: token.customerID },
      data: { emailVerified: true },
    });
    return true;
  });
}
