import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { getIO } from '../socket';

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getForUser(
        req.user!.userId
      );
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.userId);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.userId);

      // Push updated count via WebSocket
      const count = await notificationService.getUnreadCount(req.user!.userId);
      const io = getIO();
      io.to(`user:${req.user!.userId}`).emit('notification:count', { count });

      res.json({ success: true, data: { message: 'Notification marked as read' } });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.userId);

      // Push updated count via WebSocket
      const io = getIO();
      io.to(`user:${req.user!.userId}`).emit('notification:count', { count: 0 });

      res.json({
        success: true,
        data: { message: 'All notifications marked as read' },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
