import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  clientId: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
