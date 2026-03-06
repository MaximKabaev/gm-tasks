'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskWithAssignee, PREDEFINED_LABELS } from '@/lib/types';
import TaskCard from './TaskCard';
import { TaskStatus, Priority } from '@prisma/client';

interface KanbanBoardProps {
  initialTasks: TaskWithAssignee[];
  projectId: string;
  users: Array<{ id: string; name: string; email: string }>;
  onTaskClick: (task: TaskWithAssignee) => void;
  onRefresh: () => void;
}

const columns = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
];

export default function KanbanBoard({
  initialTasks,
  projectId,
  users,
  onTaskClick,
  onRefresh,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [customLabels, setCustomLabels] = useState<Array<{ name: string; color: string }>>([]);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('bg-blue-600');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    assigneeId: '',
    dueDate: '',
    labels: [] as string[],
  });

  // Sync local state when initialTasks prop changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Load custom labels from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('customLabels');
    if (stored) {
      setCustomLabels(JSON.parse(stored));
    }
  }, []);

  // Save custom labels to localStorage when they change
  useEffect(() => {
    if (customLabels.length > 0) {
      localStorage.setItem('customLabels', JSON.stringify(customLabels));
    }
  }, [customLabels]);

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(task => {
        if (task.status !== status) return false;

        // Filter by labels
        if (selectedLabels.length > 0) {
          const taskLabels = task.labels ? JSON.parse(task.labels) : [];
          if (!selectedLabels.some(selectedLabel => taskLabels.includes(selectedLabel))) return false;
        }

        // Filter by assignees
        if (selectedAssignees.length > 0) {
          const assigneeId = task.assigneeId || 'unassigned';
          if (!selectedAssignees.includes(assigneeId)) return false;
        }

        return true;
      })
      .sort((a, b) => a.position - b.position);
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const toggleAssignee = (assigneeId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(assigneeId)
        ? prev.filter(a => a !== assigneeId)
        : [...prev, assigneeId]
    );
  };

  const clearFilters = () => {
    setSelectedLabels([]);
    setSelectedAssignees([]);
  };

  const hasActiveFilters = selectedLabels.length > 0 || selectedAssignees.length > 0;

  const allLabels = [...PREDEFINED_LABELS, ...customLabels];

  const availableColors = [
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-purple-600',
    'bg-fuchsia-600',
    'bg-pink-600',
    'bg-rose-600',
    'bg-red-600',
    'bg-orange-600',
    'bg-amber-600',
    'bg-yellow-600',
    'bg-lime-600',
    'bg-green-600',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-cyan-600',
  ];

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;

    // Check if label already exists
    if (allLabels.some(l => l.name.toLowerCase() === newLabelName.toLowerCase())) {
      alert('A label with this name already exists');
      return;
    }

    setCustomLabels([...customLabels, { name: newLabelName, color: newLabelColor }]);
    setNewLabelName('');
    setNewLabelColor('bg-blue-600');
    setIsAddingLabel(false);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as TaskStatus;
    const sourceTasks = getTasksByStatus(source.droppableId);
    const destTasks = getTasksByStatus(destination.droppableId);

    // Optimistic update
    const updatedTasks = tasks.map(t => {
      if (t.id === draggableId) {
        return { ...t, status: newStatus, position: destination.index };
      }
      return t;
    });

    setTasks(updatedTasks);

    // Update on server
    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          position: destination.index,
        }),
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to update task:', error);
      setTasks(tasks); // Revert on error
    }
  };

  const handleAddTask = async (status: string) => {
    if (!newTask.title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          assigneeId: newTask.assigneeId || null,
          dueDate: newTask.dueDate || null,
          labels: newTask.labels,
          projectId,
          status,
        }),
      });

      if (res.ok) {
        const { task } = await res.json();
        setTasks([...tasks, task]);
        resetNewTaskForm();
        setIsAddingTask(null);
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'MEDIUM' as Priority,
      assigneeId: '',
      dueDate: '',
      labels: [],
    });
  };

  const toggleNewTaskLabel = (label: string) => {
    setNewTask(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Filter Bar */}
      <div className="mb-6 bg-gray-900 rounded-lg p-4 border border-gray-800 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-gray-400 text-sm font-medium min-w-[110px]">Filter by labels:</span>
          {allLabels.map(label => (
            <button
              key={label.name}
              onClick={() => toggleLabel(label.name)}
              className={`px-3 py-1.5 text-xs rounded transition-all ${
                selectedLabels.includes(label.name)
                  ? `${label.color} text-white ring-2 ring-white/50`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {label.name}
            </button>
          ))}
          <button
            onClick={() => setIsAddingLabel(true)}
            className="p-1.5 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700 rounded transition-colors"
            title="Add new label"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-gray-400 text-sm font-medium min-w-[110px]">Filter by assignee:</span>
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => toggleAssignee(user.id)}
              className={`px-3 py-1.5 text-xs rounded transition-all ${
                selectedAssignees.includes(user.id)
                  ? 'bg-blue-600 text-white ring-2 ring-white/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {user.name}
            </button>
          ))}
          <button
            onClick={() => toggleAssignee('unassigned')}
            className={`px-3 py-1.5 text-xs rounded transition-all ${
              selectedAssignees.includes('unassigned')
                ? 'bg-gray-600 text-white ring-2 ring-white/50'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            Unassigned
          </button>
        </div>
        {hasActiveFilters && (
          <div className="flex">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Add Label Modal */}
      {isAddingLabel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsAddingLabel(false)}>
          <div
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Add New Label</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Label Name</label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="e.g., documentation, testing..."
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddLabel();
                    if (e.key === 'Escape') setIsAddingLabel(false);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewLabelColor(color)}
                      className={`w-8 h-8 rounded ${color} ${
                        newLabelColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddLabel}
                  disabled={!newLabelName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
                >
                  Add Label
                </button>
                <button
                  onClick={() => {
                    setIsAddingLabel(false);
                    setNewLabelName('');
                    setNewLabelColor('bg-blue-600');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div key={column.id} className="flex flex-col">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">
                    {column.title}
                    <span className="ml-2 text-gray-500 text-sm">
                      {columnTasks.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setIsAddingTask(column.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Add task"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {isAddingTask === column.id && (
                  <div className="mb-3 bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title..."
                      autoFocus
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Description (optional)..."
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Priority</label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Assignee</label>
                        <select
                          value={newTask.assigneeId}
                          onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Labels</label>
                      <div className="flex flex-wrap gap-1">
                        {allLabels.map((label) => (
                          <button
                            key={label.name}
                            type="button"
                            onClick={() => toggleNewTaskLabel(label.name)}
                            className={`px-2 py-1 text-xs rounded transition-all ${
                              newTask.labels.includes(label.name)
                                ? `${label.color} text-white`
                                : 'bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleAddTask(column.id)}
                        disabled={!newTask.title.trim()}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded font-medium transition-colors"
                      >
                        Create Task
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingTask(null);
                          resetNewTaskForm();
                        }}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-gray-800/50 rounded' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onTaskClick(task)}
                              className={snapshot.isDragging ? 'opacity-50' : ''}
                            >
                              <TaskCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
