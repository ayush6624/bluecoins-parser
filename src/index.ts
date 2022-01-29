import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Checking
  const d = await prisma.transactions.findFirst({
    where: {
      itemID: 65,
    },
  });
  console.log('result ->', d.accountID);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
