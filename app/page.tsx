import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ProjectsList from '@/components/ProjectsList';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProjectsList initialProjects={projects} />
      </main>
    </div>
  );
}
