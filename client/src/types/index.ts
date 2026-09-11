// Shared TypeScript types for the frontend

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'TASK_OVERDUE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company: string;
  createdAt: string;
  _count?: { projects: number };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  clientId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; company: string };
  createdBy?: { id: string; name: string; email?: string };
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  isOverdue: boolean;
  projectId: string;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string; email: string } | null;
  project?: { id: string; name: string; createdById?: string };
  activityLogs?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  projectId: string;
  taskId?: string;
  createdAt: string;
  user?: { id: string; name: string; role?: string };
  task?: { id: string; title: string };
  project?: { id: string; name: string };
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  userId: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  task?: { id: string; title: string };
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Array<{ status: TaskStatus; _count: number }>;
  tasksByPriority: Array<{ priority: TaskPriority; _count: number }>;
  overdueTasks: number;
  upcomingTasks: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
