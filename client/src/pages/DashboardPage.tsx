import { useEffect, useState } from 'react';
import { Layers, CheckSquare, AlertTriangle, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getDashboardStats } from '../api/projects.api';
import ActivityFeed from '../components/feed/ActivityFeed';
import type { DashboardStats, ActivityLog } from '../types';
import { getSocket } from '../hooks/useSocket';
import './DashboardPage.css';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'var(--status-todo)',
  IN_PROGRESS: 'var(--status-progress)',
  IN_REVIEW: 'var(--status-review)',
  DONE: 'var(--status-done)',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCatchup = (events: ActivityLog[]) => {
      setActivities(events);
    };

    const handleStatusChange = (data: { activityLog: ActivityLog }) => {
      setActivities((prev) => [data.activityLog, ...prev].slice(0, 20));
    };

    const handlePresence = (data: { onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
    };

    socket.on('activity:catchup', handleCatchup);
    socket.on('task:statusChanged', handleStatusChange);
    socket.on('presence:update', handlePresence);

    return () => {
      socket.off('activity:catchup', handleCatchup);
      socket.off('task:statusChanged', handleStatusChange);
      socket.off('presence:update', handlePresence);
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card card animate-fade-in" style={{ animationDelay: '0ms' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent)' }}>
            <Layers size={20} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{stats?.totalProjects ?? 0}</p>
            <p className="stat-label">Total Projects</p>
          </div>
        </div>

        <div className="stat-card card animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <CheckSquare size={20} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{stats?.totalTasks ?? 0}</p>
            <p className="stat-label">Total Tasks</p>
          </div>
        </div>

        <div className="stat-card card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="stat-icon" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{stats?.overdueTasks ?? 0}</p>
            <p className="stat-label">Overdue Tasks</p>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="stat-card card animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Users size={20} />
            </div>
            <div className="stat-info">
              <p className="stat-value">{onlineCount}</p>
              <p className="stat-label">Users Online</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="dashboard-content">
        {/* Task Status Breakdown */}
        <div className="card dashboard-chart animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="section-title">
            <TrendingUp size={18} /> Tasks by Status
          </h3>
          <div className="status-bars">
            {stats?.tasksByStatus.map((item) => {
              const percentage = stats.totalTasks > 0
                ? Math.round((item._count / stats.totalTasks) * 100)
                : 0;
              return (
                <div key={item.status} className="status-bar-item">
                  <div className="status-bar-header">
                    <span className="status-bar-label">{STATUS_LABELS[item.status] || item.status}</span>
                    <span className="status-bar-count">{item._count} ({percentage}%)</span>
                  </div>
                  <div className="status-bar-track">
                    <div
                      className="status-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        background: STATUS_COLORS[item.status] || 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        {stats?.upcomingTasks && stats.upcomingTasks.length > 0 && (
          <div className="card dashboard-upcoming animate-fade-in" style={{ animationDelay: '250ms' }}>
            <h3 className="section-title">
              <Clock size={18} /> Due This Week
            </h3>
            <div className="upcoming-list">
              {stats.upcomingTasks.map((task) => (
                <div key={task.id} className="upcoming-item">
                  <div className="upcoming-info">
                    <p className="upcoming-title">{task.title}</p>
                    <p className="upcoming-project">{task.project?.name}</p>
                  </div>
                  <div className="upcoming-meta">
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="upcoming-date">
                        {new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="dashboard-feed animate-fade-in" style={{ animationDelay: '300ms' }}>
          <ActivityFeed
            activities={activities}
            title={
              user?.role === 'ADMIN'
                ? 'Global Activity Feed'
                : user?.role === 'PROJECT_MANAGER'
                ? 'Your Projects Activity'
                : 'Your Task Activity'
            }
          />
        </div>
      </div>
    </div>
  );
}
