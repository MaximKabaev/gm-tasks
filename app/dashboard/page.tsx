import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { PRIORITY_COLORS, PREDEFINED_LABELS, STATUS_NAMES } from '@/lib/types';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const myTasks = await prisma.task.findMany({
    where: {
      assigneeId: user.id,
      status: { not: 'DONE' },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' },
    ],
  });

  const overdueTasks = myTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < new Date()
  );

  const upcomingTasks = myTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) >= new Date()
  );

  const tasksByStatus = {
    TODO: myTasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: myTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    REVIEW: myTasks.filter((t) => t.status === 'REVIEW').length,
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Tasks</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">To Do</p>
            <p className="text-3xl font-bold text-white">{tasksByStatus.TODO}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">In Progress</p>
            <p className="text-3xl font-bold text-blue-400">{tasksByStatus.IN_PROGRESS}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">In Review</p>
            <p className="text-3xl font-bold text-yellow-400">{tasksByStatus.REVIEW}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Overdue</p>
            <p className="text-3xl font-bold text-red-400">{overdueTasks.length}</p>
          </div>
        </div>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Overdue Tasks</h2>
            <div className="space-y-3">
              {overdueTasks.map((task) => {
                const labels = task.labels ? JSON.parse(task.labels) : [];
                return (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project.id}`}
                    className="block p-4 bg-gray-900 border border-red-900/50 rounded-lg hover:border-red-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{task.title}</h3>
                        <p className="text-gray-500 text-sm mb-2">{task.project.name}</p>
                        {labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {labels.map((label: string) => {
                              const labelConfig = PREDEFINED_LABELS.find((l) => l.name === label);
                              return (
                                <span
                                  key={label}
                                  className={`px-2 py-1 text-xs rounded ${labelConfig?.color || 'bg-gray-700'} text-white`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        <p className="text-red-400 text-sm mt-1">
                          Due {new Date(task.dueDate!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Active Tasks</h2>
          {myTasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-gray-400">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((task) => {
                const labels = task.labels ? JSON.parse(task.labels) : [];
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

                return (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project.id}`}
                    className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium">{task.title}</h3>
                          <span className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-300">
                            {STATUS_NAMES[task.status]}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-2">{task.project.name}</p>
                        {task.description && (
                          <p className="text-gray-400 text-sm mb-2 line-clamp-1">{task.description}</p>
                        )}
                        {labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {labels.map((label: string) => {
                              const labelConfig = PREDEFINED_LABELS.find((l) => l.name === label);
                              return (
                                <span
                                  key={label}
                                  className={`px-2 py-1 text-xs rounded ${labelConfig?.color || 'bg-gray-700'} text-white`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <p className={`text-sm mt-1 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
