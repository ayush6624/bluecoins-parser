import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
}

main()
  .then(() =>
    console.log('server started successfully at http://localhost:3000')
  )
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
