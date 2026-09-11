import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Calendar, ChevronRight } from 'lucide-react';
import { getProjects, getClients, createProject } from '../api/projects.api';
import { useAuthStore } from '../store/authStore';
import type { Project, Client } from '../types';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', clientId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
      if (user?.role !== 'DEVELOPER') {
        const clientsData = await getClients();
        setClients(clientsData);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.clientId) return;
    setCreating(true);
    try {
      await createProject(newProject);
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', clientId: '' });
      loadData();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'var(--status-done)',
    COMPLETED: 'var(--status-todo)',
    ON_HOLD: 'var(--status-progress)',
  };

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h2 className="projects-title">Your Projects</h2>
          <p className="projects-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role !== 'DEVELOPER' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} id="create-project-btn">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="projects-grid">
        {projects.map((project, index) => (
          <Link
            to={`/projects/${project.id}`}
            key={project.id}
            className="project-card card animate-fade-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="project-card-header">
              <div className="project-icon">
                <FolderKanban size={18} />
              </div>
              <span className="project-status-dot" style={{ background: statusColors[project.status] || 'var(--text-muted)' }} />
            </div>
            <h3 className="project-name">{project.name}</h3>
            {project.description && (
              <p className="project-desc">{project.description}</p>
            )}
            <div className="project-meta">
              <span className="project-client">{project.client?.company}</span>
              <span className="project-tasks-count">{project._count?.tasks ?? 0} tasks</span>
            </div>
            <div className="project-footer">
              <span className="project-date">
                <Calendar size={12} />
                {new Date(project.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <ChevronRight size={16} className="project-arrow" />
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <FolderKanban size={48} strokeWidth={1} />
          <p>No projects found</p>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label" htmlFor="project-name">Project Name</label>
                <input
                  id="project-name"
                  className="input"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g., E-commerce Platform"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="project-desc">Description</label>
                <textarea
                  id="project-desc"
                  className="input"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Brief project description..."
                />
              </div>
              <div>
                <label className="label" htmlFor="project-client">Client</label>
                <select
                  id="project-client"
                  className="select"
                  value={newProject.clientId}
                  onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
