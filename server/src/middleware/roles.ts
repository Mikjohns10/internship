import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * Factory function that creates middleware to restrict access by role.
 * Usage: requireRole('ADMIN', 'PROJECT_MANAGER')
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
      return;
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        },
      });
      return;
    }

    next();
  };
}
