import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSocket } from '../../hooks/useSocket';
import './DashboardLayout.css';

export default function DashboardLayout() {
  // Initialize socket connection when layout mounts
  useSocket();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
