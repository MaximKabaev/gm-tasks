import { Task, User, Project, Comment } from '@prisma/client';

export type TaskWithAssignee = Task & {
  assignee: Pick<User, 'id' | 'name' | 'email'> | null;
};

export type TaskWithDetails = Task & {
  assignee: Pick<User, 'id' | 'name' | 'email'> | null;
  comments: (Comment & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  project: Pick<Project, 'id' | 'name'>;
};

export const PREDEFINED_LABELS = [
  { name: 'frontend', color: 'bg-cyan-600' },
  { name: 'backend', color: 'bg-purple-600' },
  { name: 'design', color: 'bg-pink-600' },
  { name: 'bug', color: 'bg-red-600' },
  { name: 'feature', color: 'bg-green-600' },
  { name: 'urgent', color: 'bg-orange-600' },
] as const;

export const PRIORITY_COLORS = {
  LOW: 'text-gray-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400',
} as const;

export const STATUS_NAMES = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
} as const;
