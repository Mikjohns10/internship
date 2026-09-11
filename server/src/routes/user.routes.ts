import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users — Admin only
router.get('/', requireRole('ADMIN'), (req, res, next) =>
  userController.getAll(req, res, next)
);

// GET /api/users/developers — Admin + PM (for task assignment)
router.get(
  '/developers',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  (req, res, next) => userController.getDevelopers(req, res, next)
);

export default router;
