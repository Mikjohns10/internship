import cron from 'node-cron';
import prisma from '../config/db';
import { activityLogService } from '../services/activityLog.service';
import { notificationService } from '../services/notification.service';

/**
 * Overdue Task Checker
 * Runs every 5 minutes to flag tasks past their due date as overdue.
 * This is a scheduled background job — NOT triggered on page load.
 */
export function startOverdueChecker() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[Cron] Checking for overdue tasks...');

      // Find tasks that are past due, not done, and not already flagged
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
          isOverdue: false,
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, createdById: true } },
        },
      });

      if (overdueTasks.length === 0) {
        return;
      }

      console.log(`[Cron] Found ${overdueTasks.length} newly overdue tasks`);

      // Flag each as overdue and create activity log + notifications
      for (const task of overdueTasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
        });

        // Activity log entry
        await activityLogService.create({
          action: 'TASK_OVERDUE',
          details: `"${task.title}" is now overdue`,
          userId: task.project.createdById, // attribute to PM
          projectId: task.projectId,
          taskId: task.id,
        });

        // Notify the assigned developer
        if (task.assignedToId) {
          await notificationService.create({
            type: 'TASK_OVERDUE',
            message: `"${task.title}" in ${task.project.name} is now overdue`,
            userId: task.assignedToId,
            taskId: task.id,
            projectId: task.projectId,
          });
        }

        // Notify the PM
        await notificationService.create({
          type: 'TASK_OVERDUE',
          message: `"${task.title}" in ${task.project.name} is now overdue`,
          userId: task.project.createdById,
          taskId: task.id,
          projectId: task.projectId,
        });
      }

      console.log(`[Cron] Flagged ${overdueTasks.length} tasks as overdue`);
    } catch (err) {
      console.error('[Cron] Error checking overdue tasks:', err);
    }
  });

  console.log('[Cron] Overdue task checker scheduled (every 5 minutes)');
}
