import { Prisma } from '../generated/prisma/client';

// Returns null when the email already exists (also covers two simultaneous sign-ups)
export async function createCustomer(email: string, passwordHash: string) {
  const { prisma } = await import('../prismaClient');
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { userID: true },
    });
    return { customerID: user.userID };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}
