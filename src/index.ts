import { PrismaClient } from '@prisma/client';
import { start } from './server';

const prisma = new PrismaClient();

async function main() {
  // Checking
  const d = await prisma.transactions.findMany({});
  // console.log('result ->', d.map((x) => x.notes).join('\n'));
}

main()
  .then(() => {
    start();
  })
  .then(() => console.log('server started successfully at http://localhost:3000'))
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
