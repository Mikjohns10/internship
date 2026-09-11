import prisma from '../config/db';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  /**
   * Create a notification and return it with relations.
   */
  async create(data: {
    type: NotificationType;
    message: string;
    userId: string;
    taskId?: string;
    projectId?: string;
  }) {
    return prisma.notification.create({
      data: {
        type: data.type,
        message: data.message,
        userId: data.userId,
        taskId: data.taskId,
        projectId: data.projectId,
      },
    });
  }

  /**
   * Get notifications for a user, newest first.
   */
  async getForUser(userId: string, limit: number = 30) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        task: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Get unread count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationService = new NotificationService();
