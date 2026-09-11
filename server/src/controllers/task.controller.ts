import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { getIO } from '../socket';

export class TaskController {
  async getByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await taskService.getByProject(
        req.params.projectId,
        req.user!.userId,
        req.user!.role,
        {
          status: req.query.status as string | undefined,
          priority: req.query.priority as string | undefined,
          dueDateFrom: req.query.dueDateFrom as string | undefined,
          dueDateTo: req.query.dueDateTo as string | undefined,
        }
      );
      res.json({ success: true, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { task, notification } = await taskService.create(
        req.params.projectId,
        req.body,
        req.user!.userId,
        req.user!.role
      );

      // Emit socket event for real-time feed
      const io = getIO();
      io.to(`project:${task.projectId}`).emit('task:created', {
        task,
        projectId: task.projectId,
      });

      // Notify assigned developer in real-time
      if (notification && task.assignedToId) {
        io.to(`user:${task.assignedToId}`).emit('notification:new', notification);
      }

      res.status(201).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taskService.updateStatus(
        req.params.id,
        req.body.status,
        req.user!.userId,
        req.user!.role
      );

      // Emit socket events
      const io = getIO();

      // Activity feed update — goes to everyone viewing this project
      io.to(`project:${result.task.projectId}`).emit('task:statusChanged', {
        activityLog: result.activityLog,
        task: result.task,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus,
      });

      // Also emit to global feed for admins
      io.to('global-feed').emit('task:statusChanged', {
        activityLog: result.activityLog,
        task: result.task,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus,
      });

      // Notification to PM if task moved to In Review
      if (result.notification) {
        io.to(`user:${result.task.project.createdById}`).emit(
          'notification:new',
          result.notification
        );
      }

      res.json({ success: true, data: result.task });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { task, notification } = await taskService.update(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role
      );

      const io = getIO();
      io.to(`project:${task.projectId}`).emit('task:updated', { task });

      if (notification && task.assignedToId) {
        io.to(`user:${task.assignedToId}`).emit('notification:new', notification);
      }

      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taskService.delete(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await taskService.getDashboardStats(
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const taskController = new TaskController();
