import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/project.schema';

const router = Router();

router.use(authenticate);

// GET /api/projects — role-scoped in service
router.get('/', (req, res, next) =>
  projectController.getAll(req, res, next)
);

// GET /api/projects/:id — role-scoped in service
router.get('/:id', (req, res, next) =>
  projectController.getById(req, res, next)
);

// GET /api/projects/:id/stats
router.get('/:id/stats', (req, res, next) =>
  projectController.getStats(req, res, next)
);

// POST /api/projects — Admin + PM only
router.post(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate(createProjectSchema),
  (req, res, next) => projectController.create(req, res, next)
);

// PUT /api/projects/:id — Admin + PM, scoped in service
router.put(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate(updateProjectSchema),
  (req, res, next) => projectController.update(req, res, next)
);

// DELETE /api/projects/:id — Admin only
router.delete('/:id', requireRole('ADMIN'), (req, res, next) =>
  projectController.delete(req, res, next)
);

export default router;
