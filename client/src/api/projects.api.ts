import api from './axios';
import type { ApiResponse, Project, Client, DashboardStats, User } from '../types';

export async function getProjects(): Promise<Project[]> {
  const res = await api.get<ApiResponse<Project[]>>('/projects');
  return res.data.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return res.data.data;
}

export async function createProject(data: { name: string; description?: string; clientId: string }): Promise<Project> {
  const res = await api.post<ApiResponse<Project>>('/projects', data);
  return res.data.data;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const res = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
  return res.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function getClients(): Promise<Client[]> {
  const res = await api.get<ApiResponse<Client[]>>('/clients');
  return res.data.data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>('/tasks/dashboard');
  return res.data.data;
}

export async function getDevelopers(): Promise<User[]> {
  const res = await api.get<ApiResponse<User[]>>('/users/developers');
  return res.data.data;
}

export async function getUsers(): Promise<User[]> {
  const res = await api.get<ApiResponse<User[]>>('/users');
  return res.data.data;
}
