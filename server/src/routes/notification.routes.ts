import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', (req, res, next) =>
  notificationController.getAll(req, res, next)
);

// GET /api/notifications/unread-count
router.get('/unread-count', (req, res, next) =>
  notificationController.getUnreadCount(req, res, next)
);

// PATCH /api/notifications/read-all
router.patch('/read-all', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req, res, next) =>
  notificationController.markAsRead(req, res, next)
);

export default router;
