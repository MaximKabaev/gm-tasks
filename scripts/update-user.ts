import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating user name from George to German...');

  const result = await prisma.user.updateMany({
    where: {
      email: 'george@gm-studio.dev',
    },
    data: {
      name: 'German',
    },
  });

  console.log(`Updated ${result.count} user(s)`);

  // Verify the update
  const user = await prisma.user.findUnique({
    where: { email: 'george@gm-studio.dev' },
    select: { name: true, email: true },
  });

  console.log('User after update:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
