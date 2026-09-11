import { TaskStatus, TaskPriority } from '@prisma/client';
import prisma from '../config/db';
import { createAppError } from '../middleware/errorHandler';
import { activityLogService } from './activityLog.service';
import { notificationService } from './notification.service';
import { CreateTaskInput, UpdateTaskInput } from '../validators/task.schema';

// Status labels for human-readable activity messages
const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export class TaskService {
  /**
   * Get tasks for a project, filtered by query params and scoped by role.
   */
  async getByProject(
    projectId: string,
    userId: string,
    role: string,
    filters?: {
      status?: string;
      priority?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
    }
  ) {
    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw createAppError('Project not found', 404);
    }

    // PM can only see their project's tasks
    if (role === 'PROJECT_MANAGER' && project.createdById !== userId) {
      throw createAppError('Access denied', 403);
    }

    const where: any = { projectId };

    // Developer can only see their own tasks
    if (role === 'DEVELOPER') {
      where.assignedToId = userId;
    }

    // Apply filters
    if (filters?.status) {
      where.status = filters.status as TaskStatus;
    }
    if (filters?.priority) {
      where.priority = filters.priority as TaskPriority;
    }
    if (filters?.dueDateFrom || filters?.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = new Date(filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = new Date(filters.dueDateTo);
      }
    }

    return prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  /**
   * Get a single task by ID with access check.
   */
  async getById(taskId: string, userId: string, role: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: {
          select: { id: true, name: true, createdById: true },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task) {
      throw createAppError('Task not found', 404);
    }

    // Developer can only see tasks assigned to them
    if (role === 'DEVELOPER' && task.assignedToId !== userId) {
      throw createAppError('Access denied — this task is not assigned to you', 403);
    }

    // PM can only see tasks in their own projects
    if (role === 'PROJECT_MANAGER' && task.project.createdById !== userId) {
      throw createAppError('Access denied', 403);
    }

    return task;
  }

  /**
   * Create a new task in a project.
   */
  async create(
    projectId: string,
    data: CreateTaskInput,
    userId: string,
    role: string
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw createAppError('Project not found', 404);
    }

    // PM can only create tasks in their own projects
    if (role === 'PROJECT_MANAGER' && project.createdById !== userId) {
      throw createAppError('Access denied — you can only add tasks to your own projects', 403);
    }

    // Verify assigned developer exists if provided
    if (data.assignedToId) {
      const dev = await prisma.user.findUnique({
        where: { id: data.assignedToId },
      });
      if (!dev) {
        throw createAppError('Assigned user not found', 404);
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: (data.status as TaskStatus) || 'TODO',
        priority: (data.priority as TaskPriority) || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId,
        assignedToId: data.assignedToId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Log the creation
    const userName = (await prisma.user.findUnique({ where: { id: userId } }))?.name || 'Unknown';
    await activityLogService.create({
      action: 'TASK_CREATED',
      details: `${userName} created task "${task.title}"`,
      userId,
      projectId,
      taskId: task.id,
    });

    // Notify assigned developer
    if (data.assignedToId) {
      const notification = await notificationService.create({
        type: 'TASK_ASSIGNED',
        message: `You've been assigned to "${task.title}" in ${task.project.name}`,
        userId: data.assignedToId,
        taskId: task.id,
        projectId,
      });

      return { task, notification };
    }

    return { task, notification: null };
  }

  /**
   * Update task status — the most critical operation.
   * Records change in activity log, triggers notifications, returns data for socket emission.
   */
  async updateStatus(
    taskId: string,
    newStatus: TaskStatus,
    userId: string,
    role: string
  ) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true, createdById: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw createAppError('Task not found', 404);
    }

    // Developer can only update tasks assigned to them
    if (role === 'DEVELOPER' && task.assignedToId !== userId) {
      throw createAppError('Access denied — this task is not assigned to you', 403);
    }

    // PM can only update tasks in their own projects
    if (role === 'PROJECT_MANAGER' && task.project.createdById !== userId) {
      throw createAppError('Access denied', 403);
    }

    const oldStatus = task.status;
    if (oldStatus === newStatus) {
      throw createAppError('Task is already in that status', 400);
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        // Clear overdue flag if task is done
        isOverdue: newStatus === 'DONE' ? false : task.isOverdue,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, createdById: true } },
      },
    });

    // Get the user who made the change
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const actorName = actor?.name || 'Someone';

    // Record in activity log
    const activityDetails = `${actorName} moved "${task.title}" from ${STATUS_LABELS[oldStatus]} → ${STATUS_LABELS[newStatus]}`;
    const activityLog = await activityLogService.create({
      action: 'STATUS_CHANGE',
      details: activityDetails,
      userId,
      projectId: task.projectId,
      taskId: task.id,
      oldValue: oldStatus,
      newValue: newStatus,
    });

    // Notification: if moved to IN_REVIEW, notify the PM
    let notification = null;
    if (newStatus === 'IN_REVIEW' && task.project.createdById !== userId) {
      notification = await notificationService.create({
        type: 'TASK_STATUS_CHANGED',
        message: `"${task.title}" has been moved to In Review by ${actorName}`,
        userId: task.project.createdById,
        taskId: task.id,
        projectId: task.projectId,
      });
    }

    return {
      task: updatedTask,
      activityLog,
      notification,
      oldStatus,
      newStatus,
    };
  }

  /**
   * Full update of a task (title, description, priority, etc.)
   */
  async update(
    taskId: string,
    data: UpdateTaskInput,
    userId: string,
    role: string
  ) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { createdById: true } } },
    });

    if (!task) {
      throw createAppError('Task not found', 404);
    }

    if (role === 'PROJECT_MANAGER' && task.project.createdById !== userId) {
      throw createAppError('Access denied', 403);
    }

    const updateData: any = { ...data };
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // If assigning to a new developer, create notification
    let notification = null;
    if (data.assignedToId && data.assignedToId !== task.assignedToId) {
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
      });

      notification = await notificationService.create({
        type: 'TASK_ASSIGNED',
        message: `You've been assigned to "${updatedTask.title}" in ${updatedTask.project.name}`,
        userId: data.assignedToId,
        taskId: updatedTask.id,
        projectId: updatedTask.projectId,
      });

      const actor = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await activityLogService.create({
        action: 'TASK_ASSIGNED',
        details: `${actor?.name || 'Someone'} assigned "${updatedTask.title}" to ${updatedTask.assignedTo?.name || 'a developer'}`,
        userId,
        projectId: updatedTask.projectId,
        taskId: updatedTask.id,
      });

      return { task: updatedTask, notification };
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return { task: updatedTask, notification };
  }

  /**
   * Delete a task.
   */
  async delete(taskId: string, userId: string, role: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { createdById: true } } },
    });

    if (!task) {
      throw createAppError('Task not found', 404);
    }

    if (role === 'PROJECT_MANAGER' && task.project.createdById !== userId) {
      throw createAppError('Access denied', 403);
    }

    await prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted successfully' };
  }

  /**
   * Get dashboard stats.
   */
  async getDashboardStats(userId: string, role: string) {
    let taskWhere: any = {};
    let projectWhere: any = {};

    if (role === 'PROJECT_MANAGER') {
      projectWhere = { createdById: userId };
      taskWhere = { project: { createdById: userId } };
    } else if (role === 'DEVELOPER') {
      taskWhere = { assignedToId: userId };
    }

    const [
      totalProjects,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      upcomingTasks,
    ] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.task.count({ where: taskWhere }),
      prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: taskWhere,
        _count: true,
      }),
      prisma.task.count({ where: { ...taskWhere, isOverdue: true } }),
      prisma.task.findMany({
        where: {
          ...taskWhere,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next 7 days
          },
          status: { not: 'DONE' },
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
    ]);

    return {
      totalProjects,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      upcomingTasks,
    };
  }
}

export const taskService = new TaskService();
