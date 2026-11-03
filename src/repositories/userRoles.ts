export async function findRoleNameForUser(userID: string): Promise<string | null> {
  const { prisma } = await import('../prismaClient');

  const user = await prisma.user.findUnique({
    where: { userID },
    select: { role: { select: { name: true } } },
  });

  return user?.role?.name ?? null;
}
