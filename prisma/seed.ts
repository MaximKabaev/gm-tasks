import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('changeme123', 10);

  // Create users
  const maxim = await prisma.user.upsert({
    where: { email: 'maxim@gm-studio.dev' },
    update: {},
    create: {
      email: 'maxim@gm-studio.dev',
      password: hashedPassword,
      name: 'Maxim',
    },
  });

  const german = await prisma.user.upsert({
    where: { email: 'george@gm-studio.dev' },
    update: {},
    create: {
      email: 'george@gm-studio.dev',
      password: hashedPassword,
      name: 'German',
    },
  });

  console.log('Created users:', { maxim, german });

  // Create a sample project
  const sampleProject = await prisma.project.create({
    data: {
      name: 'G&M Studio Website',
      description: 'Company website redesign',
      clientName: 'Internal',
      tasks: {
        create: [
          {
            title: 'Design homepage mockup',
            description: 'Create modern dark-themed homepage design',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            assigneeId: german.id,
            labels: JSON.stringify(['design', 'frontend']),
            position: 0,
          },
          {
            title: 'Set up backend API',
            description: 'Initialize Node.js backend with authentication',
            status: 'TODO',
            priority: 'URGENT',
            assigneeId: maxim.id,
            labels: JSON.stringify(['backend', 'feature']),
            position: 0,
          },
          {
            title: 'Implement user authentication',
            description: 'JWT-based auth system',
            status: 'REVIEW',
            priority: 'HIGH',
            assigneeId: maxim.id,
            labels: JSON.stringify(['backend', 'feature']),
            position: 0,
          },
          {
            title: 'Deploy to production',
            description: 'Set up hosting and CI/CD pipeline',
            status: 'DONE',
            priority: 'MEDIUM',
            assigneeId: maxim.id,
            labels: JSON.stringify(['backend']),
            position: 0,
          },
        ],
      },
    },
  });

  console.log('Created sample project:', sampleProject);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
