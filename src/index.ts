import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Checking
  const d = await prisma.transactions.findMany({});
  // console.log('result ->', d.map((x) => x.notes).join('\n'));

}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
