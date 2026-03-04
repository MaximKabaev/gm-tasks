'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import KanbanBoard from '@/components/KanbanBoard';
import TaskDetailModal from '@/components/TaskDetailModal';
import { TaskWithAssignee } from '@/lib/types';

interface Project {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  tasks: TaskWithAssignee[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, usersRes, meRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch('/api/users'),
        fetch('/api/auth/me'),
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData.project);
      } else {
        router.push('/');
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!project || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-gray-400">{project.description}</p>
          )}
          {project.clientName && (
            <p className="text-gray-500 text-sm mt-1">Client: {project.clientName}</p>
          )}
        </div>

        <KanbanBoard
          initialTasks={project.tasks}
          projectId={project.id}
          users={users}
          onTaskClick={(task) => setSelectedTaskId(task.id)}
          onRefresh={fetchData}
        />
      </main>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchData}
          users={users}
        />
      )}
    </div>
  );
}
