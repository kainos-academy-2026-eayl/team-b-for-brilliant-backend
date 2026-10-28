export interface userCredentials {
  userID: string;
  passwordHash: string;
}

export interface userDetails {
  userID: string;
  email: string;
  firstname: string | null;
  surname: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postcode: string | null;
  passwordHash: string | null;
  role: string | undefined;
  accessLevel: number | undefined;
  securityQuestion: string | undefined;
  securityAnswer: string | null;
}

export async function findCustomerByEmail(email: string): Promise<userCredentials | null> {
  const { prisma } = await import('../prismaClient');

  const user = await prisma.user.findUnique({
    where: { email },
    select: { userID: true, passwordHash: true },
  });

  return user ? { userID: user.userID, passwordHash: user.passwordHash } : null;
}

export async function findCustomerDetails(userID: string): Promise<userDetails | null> {
  const { prisma } = await import('../prismaClient');

  const user = await prisma.user.findUnique({
    where: { userID },
    include: { user: true, role: true, securityQuestion: true }
  });

  return user ? {userID: user.userID, email: user.email, firstname: user.firstname, surname: user.surname, addressLine1: user.addressLine1, addressLine2: user.addressLine2, postcode: user.postcode, passwordHash: user.passwordHash,role: user.role?.name, accessLevel: user.role?.accessLevel, securityQuestion: user.securityQuestion?.question, securityAnswer: user.securityAnswer} : null;
}
