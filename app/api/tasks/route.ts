import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { TaskStatus, Priority } from '@prisma/client';

// POST create new task
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, projectId, status, priority, assigneeId, dueDate, labels } = await request.json();

    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and projectId are required' },
        { status: 400 }
      );
    }

    // Get the highest position in the column
    const highestTask = await prisma.task.findFirst({
      where: { projectId, status: status || 'TODO' },
      orderBy: { position: 'desc' },
    });

    const position = highestTask ? highestTask.position + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        status: status || TaskStatus.TODO,
        priority: priority || Priority.MEDIUM,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels ? JSON.stringify(labels) : null,
        position,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
