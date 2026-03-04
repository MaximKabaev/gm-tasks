'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProjectModal from './ProjectModal';

interface Task {
  id: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  tasks: Task[];
}

interface ProjectsListProps {
  initialProjects: Project[];
}

export default function ProjectsList({ initialProjects }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectCreated = (newProject: Project) => {
    // Add the new project to the beginning of the list
    setProjects([{ ...newProject, tasks: [] }, ...projects]);
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to project page
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${projectName}"? This will also delete all tasks in this project.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove project from local state
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const getTaskCounts = (tasks: Task[]) => {
    return {
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: tasks.filter(t => t.status === 'REVIEW').length,
      done: tasks.filter(t => t.status === 'DONE').length,
    };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No projects yet</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const counts = getTaskCounts(project.tasks);
            const totalTasks = project.tasks.length;

            return (
              <div key={project.id} className="relative group">
                <Link
                  href={`/projects/${project.id}`}
                  className="block p-6 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {project.name}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete project"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {project.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  {project.clientName && (
                    <p className="text-gray-500 text-sm mb-4">
                      Client: {project.clientName}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex space-x-4">
                      <span className="text-gray-400">
                        <span className="text-gray-500">{counts.todo}</span> To Do
                      </span>
                      <span className="text-blue-400">
                        <span className="text-blue-500">{counts.inProgress}</span> In Progress
                      </span>
                      <span className="text-yellow-400">
                        <span className="text-yellow-500">{counts.review}</span> Review
                      </span>
                      <span className="text-green-400">
                        <span className="text-green-500">{counts.done}</span> Done
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
