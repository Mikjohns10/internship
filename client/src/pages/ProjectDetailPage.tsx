import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Plus, Filter, ArrowLeft, Calendar, User } from 'lucide-react';
import { getProject } from '../api/projects.api';
import { getTasksByProject, updateTaskStatus, createTask } from '../api/tasks.api';
import { getDevelopers } from '../api/projects.api';
import { useAuthStore } from '../store/authStore';
import { useSocket, getSocket } from '../hooks/useSocket';
import ActivityFeed from '../components/feed/ActivityFeed';
import type { Project, Task, TaskStatus, ActivityLog, User as UserType } from '../types';
import './ProjectDetailPage.css';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'var(--status-todo)' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'var(--status-progress)' },
  { status: 'IN_REVIEW', label: 'In Review', color: 'var(--status-review)' },
  { status: 'DONE', label: 'Done', color: 'var(--status-done)' },
];

const PRIORITIES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [developers, setDevelopers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToId: '',
  });

  // Filters from URL
  const filterStatus = searchParams.get('status') || '';
  const filterPriority = searchParams.get('priority') || '';

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [projectData, tasksData] = await Promise.all([
        getProject(id),
        getTasksByProject(id, {
          status: filterStatus || undefined,
          priority: filterPriority || undefined,
        }),
      ]);
      setProject(projectData);
      setTasks(tasksData);

      if (user?.role !== 'DEVELOPER') {
        const devs = await getDevelopers();
        setDevelopers(devs);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  }, [id, filterStatus, filterPriority, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Join project room for real-time updates
  useEffect(() => {
    if (id) {
      joinProject(id);
      return () => leaveProject(id);
    }
  }, [id, joinProject, leaveProject]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStatusChange = (data: { activityLog: ActivityLog; task: Task }) => {
      // Update task in the list
      setTasks((prev) =>
        prev.map((t) => (t.id === data.task.id ? data.task : t))
      );
      // Add to activity feed
      setActivities((prev) => [data.activityLog, ...prev].slice(0, 20));
    };

    const handleTaskCreated = (data: { task: Task }) => {
      setTasks((prev) => [...prev, data.task]);
    };

    const handleTaskUpdated = (data: { task: Task }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === data.task.id ? data.task : t))
      );
    };

    const handleCatchup = (events: ActivityLog[]) => {
      setActivities(events.filter((e) => e.projectId === id));
    };

    socket.on('task:statusChanged', handleStatusChange);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('activity:catchup', handleCatchup);

    return () => {
      socket.off('task:statusChanged', handleStatusChange);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('activity:catchup', handleCatchup);
    };
  }, [id]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      // Real-time socket will handle the UI update
    } catch (err) {
      console.error('Failed to update status:', err);
      loadData(); // Refresh on error
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTask.title) return;
    setCreating(true);
    try {
      await createTask(id, {
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
        assignedToId: newTask.assignedToId || undefined,
      });
      setShowCreateTask(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToId: '' });
      loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreating(false);
    }
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  if (!project) {
    return <div className="empty-state"><p>Project not found</p></div>;
  }

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="project-detail-header">
        <div className="project-detail-info">
          <Link to="/projects" className="back-link">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <h2>{project.name}</h2>
          {project.description && <p className="project-detail-desc">{project.description}</p>}
          <div className="project-detail-meta">
            <span className="project-client-badge">{project.client?.company}</span>
            <span className="project-pm">Created by {project.createdBy?.name}</span>
          </div>
        </div>
        <div className="project-detail-actions">
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)} id="toggle-filters-btn">
            <Filter size={15} /> Filters
          </button>
          {user?.role !== 'DEVELOPER' && (
            <button className="btn btn-primary" onClick={() => setShowCreateTask(true)} id="create-task-btn">
              <Plus size={15} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      {showFilters && (
        <div className="filters-bar animate-slide-down">
          <div className="filter-group">
            <label className="label">Status</label>
            <select className="select" value={filterStatus} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">All Statuses</option>
              {PRIORITIES.map((s) => (
                <option key={s} value={s}>{COLUMNS.find((c) => c.status === s)?.label || s}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="label">Priority</label>
            <select className="select" value={filterPriority} onChange={(e) => setFilter('priority', e.target.value)}>
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {(filterStatus || filterPriority) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearchParams({})}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Kanban Board + Activity Feed */}
      <div className="project-content">
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <div key={col.status} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-dot" style={{ background: col.color }} />
                <span className="kanban-column-title">{col.label}</span>
                <span className="kanban-column-count">{getTasksByStatus(col.status).length}</span>
              </div>
              <div className="kanban-column-body">
                {getTasksByStatus(col.status).map((task) => (
                  <div key={task.id} className={`task-card ${task.isOverdue ? 'overdue' : ''}`}>
                    <div className="task-card-top">
                      <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      {task.isOverdue && <span className="badge badge-overdue">OVERDUE</span>}
                    </div>
                    <h4 className="task-card-title">{task.title}</h4>
                    {task.description && (
                      <p className="task-card-desc">{task.description}</p>
                    )}
                    <div className="task-card-footer">
                      {task.assignedTo && (
                        <span className="task-assignee">
                          <User size={12} /> {task.assignedTo.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`task-due ${task.isOverdue ? 'overdue-text' : ''}`}>
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {/* Status change buttons */}
                    <div className="task-status-actions">
                      {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
                        <button
                          key={c.status}
                          className="btn btn-ghost btn-sm task-move-btn"
                          onClick={() => handleStatusChange(task.id, c.status)}
                          title={`Move to ${c.label}`}
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {getTasksByStatus(col.status).length === 0 && (
                  <div className="kanban-empty">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed Sidebar */}
        <div className="project-activity-sidebar">
          <ActivityFeed activities={activities} title="Project Activity" />
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="modal-overlay" onClick={() => setShowCreateTask(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Task</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label" htmlFor="task-title">Title</label>
                <input id="task-title" className="input" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" required />
              </div>
              <div>
                <label className="label" htmlFor="task-description">Description</label>
                <textarea id="task-description" className="input" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task description..." />
              </div>
              <div className="grid-2">
                <div>
                  <label className="label" htmlFor="task-priority">Priority</label>
                  <select id="task-priority" className="select" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="task-due-date">Due Date</label>
                  <input id="task-due-date" type="date" className="input" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
              </div>
              {developers.length > 0 && (
                <div>
                  <label className="label" htmlFor="task-assignee">Assign To</label>
                  <select id="task-assignee" className="select" value={newTask.assignedToId} onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
