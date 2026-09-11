import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.use(authenticate);

// GET /api/clients — Admin + PM
router.get('/', requireRole('ADMIN', 'PROJECT_MANAGER'), (req, res, next) =>
  clientController.getAll(req, res, next)
);

// GET /api/clients/:id — Admin only
router.get('/:id', requireRole('ADMIN'), (req, res, next) =>
  clientController.getById(req, res, next)
);

// POST /api/clients — Admin only
router.post('/', requireRole('ADMIN'), (req, res, next) =>
  clientController.create(req, res, next)
);

// PUT /api/clients/:id — Admin only
router.put('/:id', requireRole('ADMIN'), (req, res, next) =>
  clientController.update(req, res, next)
);

export default router;
