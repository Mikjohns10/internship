import api from './axios';
import type { ApiResponse, Notification } from '../types';

export async function getNotifications(): Promise<Notification[]> {
  const res = await api.get<ApiResponse<Notification[]>>('/notifications');
  return res.data.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return res.data.data.count;
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
