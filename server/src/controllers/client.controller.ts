import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { createAppError } from '../middleware/errorHandler';

export class ClientController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const clients = await prisma.client.findMany({
        include: {
          _count: { select: { projects: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: clients });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await prisma.client.findUnique({
        where: { id: req.params.id },
        include: {
          projects: {
            select: { id: true, name: true, status: true, createdAt: true },
          },
        },
      });

      if (!client) {
        throw createAppError('Client not found', 404);
      }

      res.json({ success: true, data: client });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, company } = req.body;
      const client = await prisma.client.create({
        data: { name, email, company },
      });
      res.status(201).json({ success: true, data: client });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await prisma.client.findUnique({
        where: { id: req.params.id },
      });
      if (!client) {
        throw createAppError('Client not found', 404);
      }

      const updated = await prisma.client.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}

export const clientController = new ClientController();
