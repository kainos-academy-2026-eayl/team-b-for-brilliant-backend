import { z } from 'zod';
import { prisma } from '../src/prismaClient';
import { hashPassword } from '../src/services/passwords';

try {
  const input = z
    .object({
      SEED_CUSTOMER_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
      SEED_CUSTOMER_PASSWORD: z.string().min(8).max(1024),
    })
    .parse(process.env);
  const passwordHash = await hashPassword(input.SEED_CUSTOMER_PASSWORD);
  await prisma.customer.upsert({
    where: { email: input.SEED_CUSTOMER_EMAIL },
    create: { email: input.SEED_CUSTOMER_EMAIL, passwordHash },
    update: {},
  });
  console.log('Local customer is available. Existing customers were not changed.');
} catch (error) {
  // Validation errors may contain input details; never log seed credentials.
  console.error(
    'Customer seed failed:',
    error instanceof z.ZodError ? 'Check seed variables' : error,
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
