import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.schema';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

// POST /api/auth/logout
router.post('/logout', (req, res) =>
  authController.logout(req, res)
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);

export default router;
