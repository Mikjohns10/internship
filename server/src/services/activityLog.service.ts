import prisma from '../config/db';

export class ActivityLogService {
  /**
   * Create a new activity log entry.
   */
  async create(data: {
    action: string;
    details: string;
    userId: string;
    projectId: string;
    taskId?: string;
    oldValue?: string;
    newValue?: string;
  }) {
    return prisma.activityLog.create({
      data: {
        action: data.action,
        details: data.details,
        userId: data.userId,
        projectId: data.projectId,
        taskId: data.taskId,
        oldValue: data.oldValue,
        newValue: data.newValue,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Get recent activity logs for a project.
   */
  async getByProject(projectId: string, limit: number = 20) {
    return prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Get global activity feed (Admin) — across all projects.
   */
  async getGlobalFeed(limit: number = 20) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        task: {
          select: { id: true, title: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Get activity feed for a PM — only their projects.
   */
  async getFeedForPM(userId: string, limit: number = 20) {
    return prisma.activityLog.findMany({
      where: {
        project: { createdById: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        task: {
          select: { id: true, title: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Get activity feed for a Developer — only tasks assigned to them.
   */
  async getFeedForDeveloper(userId: string, limit: number = 20) {
    return prisma.activityLog.findMany({
      where: {
        task: { assignedToId: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        task: {
          select: { id: true, title: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

export const activityLogService = new ActivityLogService();
