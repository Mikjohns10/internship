import { useLocation } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import { useAuthStore } from '../../store/authStore';
import './Header.css';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/clients': 'Clients',
  '/team': 'Team',
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuthStore();

  const getTitle = () => {
    if (location.pathname.startsWith('/projects/')) return 'Project Details';
    return routeTitles[location.pathname] || 'Dashboard';
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{getTitle()}</h1>
        {location.pathname === '/dashboard' && (
          <p className="header-greeting">{greeting()}, {user?.name?.split(' ')[0]} 👋</p>
        )}
      </div>
      <div className="header-right">
        <NotificationBell />
      </div>
    </header>
  );
}
