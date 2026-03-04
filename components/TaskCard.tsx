'use client';

import { useState, useEffect } from 'react';
import { TaskWithAssignee, PREDEFINED_LABELS, PRIORITY_COLORS } from '@/lib/types';

interface TaskCardProps {
  task: TaskWithAssignee;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [customLabels, setCustomLabels] = useState<Array<{ name: string; color: string }>>([]);

  // Load custom labels from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('customLabels');
    if (stored) {
      setCustomLabels(JSON.parse(stored));
    }
  }, []);

  const allLabels = [...PREDEFINED_LABELS, ...customLabels];
  const labels = task.labels ? JSON.parse(task.labels) : [];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
      <h4 className="text-white font-medium mb-2">{task.title}</h4>

      {task.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
      )}

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {labels.map((label: string) => {
            const labelConfig = allLabels.find(l => l.name === label);
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

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {task.priority && (
            <span className={`font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
          )}
          {task.dueDate && (
            <span className={isOverdue ? 'text-red-400' : 'text-gray-500'}>
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
        {task.assignee && (
          <span className="text-gray-400">{task.assignee.name}</span>
        )}
      </div>
    </div>
  );
}
