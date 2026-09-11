import api from './axios';
import type { ApiResponse, User } from '../types';

export async function login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
  const res = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', { email, password });
  return res.data.data;
}

export async function refreshToken(): Promise<{ accessToken: string; user: User }> {
  const res = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/refresh');
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}
