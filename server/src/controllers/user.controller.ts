import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async getDevelopers(_req: Request, res: Response, next: NextFunction) {
    try {
      const developers = await prisma.user.findMany({
        where: { role: 'DEVELOPER' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json({ success: true, data: developers });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
