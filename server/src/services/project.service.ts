import prisma from '../config/db';
import { createAppError } from '../middleware/errorHandler';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.schema';

export class ProjectService {
  /**
   * Get projects scoped by user role.
   * Admin: all projects
   * PM: only projects they created
   * Dev: only projects where they have assigned tasks
   */
  async getAll(userId: string, role: string) {
    let where = {};

    if (role === 'PROJECT_MANAGER') {
      where = { createdById: userId };
    } else if (role === 'DEVELOPER') {
      where = {
        tasks: {
          some: { assignedToId: userId },
        },
      };
    }
    // Admin — no filter, sees everything

    return prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get a single project by ID with role-scoped access check.
   */
  async getById(projectId: string, userId: string, role: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!project) {
      throw createAppError('Project not found', 404);
    }

    // PM can only see their own projects
    if (role === 'PROJECT_MANAGER' && project.createdById !== userId) {
      throw createAppError('Access denied — you can only view your own projects', 403);
    }

    // Developer can only see projects where they have tasks
    if (role === 'DEVELOPER') {
      const hasAssignment = project.tasks.some(
        (task) => task.assignedToId === userId
      );
      if (!hasAssignment) {
        throw createAppError('Access denied — you have no tasks in this project', 403);
      }
      // Filter tasks to only show the dev's assigned tasks
      project.tasks = project.tasks.filter(
        (task) => task.assignedToId === userId
      );
    }

    return project;
  }

  /**
   * Create a new project.
   */
  async create(data: CreateProjectInput, userId: string) {
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!client) {
      throw createAppError('Client not found', 404);
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        createdById: userId,
        status: data.status || 'ACTIVE',
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Update a project — PMs can only update their own.
   */
  async update(
    projectId: string,
    data: UpdateProjectInput,
    userId: string,
    role: string
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw createAppError('Project not found', 404);
    }

    if (role === 'PROJECT_MANAGER' && project.createdById !== userId) {
      throw createAppError('Access denied — you can only edit your own projects', 403);
    }

    return prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        client: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete a project — Admin only (enforced by route middleware).
   */
  async delete(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw createAppError('Project not found', 404);
    }

    await prisma.project.delete({ where: { id: projectId } });
    return { message: 'Project deleted successfully' };
  }

  /**
   * Get dashboard stats for a project.
   */
  async getStats(projectId: string) {
    const [total, byStatus, overdue] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      prisma.task.count({ where: { projectId, isOverdue: true } }),
    ]);

    return { total, byStatus, overdue };
  }
}

export const projectService = new ProjectService();
