import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../validators/task.schema';

const router = Router();

router.use(authenticate);

// GET /api/tasks/dashboard — dashboard stats (role-scoped)
router.get('/dashboard', (req, res, next) =>
  taskController.getDashboardStats(req, res, next)
);

// GET /api/tasks/project/:projectId — tasks for a project (role-scoped + filters)
router.get('/project/:projectId', (req, res, next) =>
  taskController.getByProject(req, res, next)
);

// GET /api/tasks/:id — single task (role-scoped)
router.get('/:id', (req, res, next) =>
  taskController.getById(req, res, next)
);

// POST /api/tasks/project/:projectId — create task (Admin + PM)
router.post(
  '/project/:projectId',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate(createTaskSchema),
  (req, res, next) => taskController.create(req, res, next)
);

// PATCH /api/tasks/:id/status — update status (all roles, scoped in service)
router.patch('/:id/status', validate(updateTaskStatusSchema), (req, res, next) =>
  taskController.updateStatus(req, res, next)
);

// PUT /api/tasks/:id — full update (Admin + PM)
router.put(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate(updateTaskSchema),
  (req, res, next) => taskController.update(req, res, next)
);

// DELETE /api/tasks/:id — delete (Admin + PM, scoped)
router.delete(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  (req, res, next) => taskController.delete(req, res, next)
);

export default router;
