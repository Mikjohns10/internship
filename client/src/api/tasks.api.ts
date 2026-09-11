import api from './axios';
import type { ApiResponse, Task, TaskStatus } from '../types';

interface TaskFilters {
  status?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export async function getTasksByProject(projectId: string, filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom);
  if (filters?.dueDateTo) params.set('dueDateTo', filters.dueDateTo);

  const res = await api.get<ApiResponse<Task[]>>(`/tasks/project/${projectId}?${params}`);
  return res.data.data;
}

export async function getTask(id: string): Promise<Task> {
  const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
  return res.data.data;
}

export async function createTask(projectId: string, data: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assignedToId?: string;
}): Promise<Task> {
  const res = await api.post<ApiResponse<Task>>(`/tasks/project/${projectId}`, data);
  return res.data.data;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status });
  return res.data.data;
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
  const res = await api.put<ApiResponse<Task>>(`/tasks/${taskId}`, data);
  return res.data.data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}
