import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Users, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth.api';
import { useSocket } from '../../hooks/useSocket';
import './Sidebar.css';

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const { disconnect } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Continue even if API call fails
    }
    disconnect();
    clearAuth();
    navigate('/login');
  };

  const roleLabel = {
    ADMIN: 'Administrator',
    PROJECT_MANAGER: 'Project Manager',
    DEVELOPER: 'Developer',
  };

  const roleBadgeClass = {
    ADMIN: 'role-admin',
    PROJECT_MANAGER: 'role-pm',
    DEVELOPER: 'role-dev',
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="sidebar-brand">ProjectHub</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FolderKanban size={18} />
          <span>Projects</span>
        </NavLink>

        {user?.role === 'ADMIN' && (
          <>
            <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Building2 size={18} />
              <span>Clients</span>
            </NavLink>
            <NavLink to="/team" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Team</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <span className={`sidebar-role-badge ${user?.role ? roleBadgeClass[user.role] : ''}`}>
              {user?.role ? roleLabel[user.role] : ''}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost sidebar-logout" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
