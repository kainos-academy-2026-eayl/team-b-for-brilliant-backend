export async function listSecurityQuestions() {
  const { prisma } = await import('../prismaClient');
  return prisma.securityQuestion.findMany({
    select: { questionID: true, question: true },
    orderBy: [{ question: 'asc' }, { questionID: 'asc' }],
  });
}

export async function findSecurityQuestion(questionID: string) {
  const { prisma } = await import('../prismaClient');
  return prisma.securityQuestion.findUnique({
    where: { questionID },
    select: { questionID: true },
  });
}
