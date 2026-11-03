import type { ProfileDto } from '../dtos/profile';
import type { UpdateProfileInput } from '../schemas/profile';

const profileFields = {
  email: true,
  firstname: true,
  surname: true,
  addressLine1: true,
  addressLine2: true,
  postcode: true,
} as const;

export async function findProfile(userID: string): Promise<ProfileDto | null> {
  const { prisma } = await import('../prismaClient');

  return prisma.user.findUnique({ where: { userID }, select: profileFields });
}

export async function saveProfile(
  userID: string,
  data: UpdateProfileInput,
): Promise<ProfileDto | null> {
  const { prisma } = await import('../prismaClient');

  // updateMany so a missing user gives count 0 instead of throwing
  const result = await prisma.user.updateMany({ where: { userID }, data });

  if (result.count === 0) {
    return null;
  }

  return prisma.user.findUnique({ where: { userID }, select: profileFields });
}
