'use client';

import { useState, useEffect } from 'react';
import { TaskWithDetails, PREDEFINED_LABELS, PRIORITY_COLORS, STATUS_NAMES } from '@/lib/types';
import { Priority, TaskStatus } from '@prisma/client';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
  users: Array<{ id: string; name: string; email: string }>;
}

export default function TaskDetailModal({ taskId, onClose, onUpdate, users }: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<TaskWithDetails>>({});
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [customLabels, setCustomLabels] = useState<Array<{ name: string; color: string }>>([]);

  // Load custom labels from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('customLabels');
    if (stored) {
      setCustomLabels(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      setTask(data.task);
      setEditedTask(data.task);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const updateData: any = {
        title: editedTask.title,
        description: editedTask.description || null,
        priority: editedTask.priority,
        assigneeId: editedTask.assigneeId || null,
        dueDate: editedTask.dueDate || null,
        labels: editedTask.labels ? JSON.parse(editedTask.labels as string) : [],
      };

      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      await fetchTask();
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setAddingComment(true);
    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      setNewComment('');
      await fetchTask();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const toggleLabel = (label: string) => {
    const labels = editedTask.labels ? JSON.parse(editedTask.labels as string) : [];
    const newLabels = labels.includes(label)
      ? labels.filter((l: string) => l !== label)
      : [...labels, label];
    setEditedTask({ ...editedTask, labels: JSON.stringify(newLabels) });
  };

  const allLabels = [...PREDEFINED_LABELS, ...customLabels];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-8">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const labels = task.labels ? JSON.parse(task.labels) : [];
  const editedLabels = editedTask.labels ? JSON.parse(editedTask.labels as string) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title and Description */}
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                  placeholder="Description..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-400 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Status, Priority, Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
              {isEditing ? (
                <select
                  value={editedTask.priority || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              ) : (
                <p className={`font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Assignee</label>
              {isEditing ? (
                <select
                  value={editedTask.assigneeId || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, assigneeId: e.target.value || null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-white">{task.assignee?.name || 'Unassigned'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Due Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value ? new Date(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-white">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No due date'}
                </p>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Labels</label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {allLabels.map((label) => (
                  <button
                    key={label.name}
                    onClick={() => toggleLabel(label.name)}
                    className={`px-3 py-1 text-sm rounded ${
                      editedLabels.includes(label.name)
                        ? `${label.color} text-white`
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {labels.length > 0 ? (
                  labels.map((label: string) => {
                    const labelConfig = allLabels.find((l) => l.name === label);
                    return (
                      <span
                        key={label}
                        className={`px-3 py-1 text-sm rounded ${labelConfig?.color || 'bg-gray-700'} text-white`}
                      >
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-gray-500">No labels</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTask(task);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  Edit Task
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Comments */}
          <div className="pt-6 border-t border-gray-800">
            <h4 className="text-lg font-semibold text-white mb-4">Comments</h4>

            <div className="space-y-4 mb-4">
              {task.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{comment.user.name}</span>
                    <span className="text-gray-500 text-sm">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}

              {task.comments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={addingComment || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
              >
                {addingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
