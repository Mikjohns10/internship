import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';

export class ProjectController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getAll(
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: projects });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.create(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.update(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectService.delete(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await projectService.getStats(req.params.id);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const projectController = new ProjectController();
