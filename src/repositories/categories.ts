export async function findCategories() {
  const { prisma } = await import('../prismaClient');
  return prisma.category.findMany({
    include: { department: true },
    orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }, { categoryID: 'asc' }],
  });
}
