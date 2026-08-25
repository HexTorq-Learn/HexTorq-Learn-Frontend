import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useAdminData } from '../../hooks/useAdmin.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { NotificationBell } from '../ui/NotificationBell.jsx';

const TABS = [
  { to: '/admin/overview', label: 'overview' },
  { to: '/admin/users', label: 'users' },
  { to: '/admin/playlists', label: 'playlists' },
  { to: '/admin/videos', label: 'videos' },
  { to: '/admin/analytics', label: 'analytics' },
  { to: '/admin/content', label: 'content' },
];

export function AdminShell() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const adminData = useAdminData();

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="brand">
          <Shield />
          <div>
            <strong>HexTorq Learn Admin</strong>
            <span>{auth?.user?.email}</span>
          </div>
        </div>
        <nav className="admin-tabs">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-actions">
          <NotificationBell />
          <ThemeToggle />
          <button className="small-button" onClick={() => navigate('/learn')}>Learner</button>
          <button className="logout" onClick={onLogout}><LogOut size={16} /> Logout</button>
        </div>
      </header>
      <section className="admin-content">
        {adminData.error && <p className="error banner-error">{adminData.error}</p>}
        <Outlet context={adminData} />
      </section>
    </main>
  );
}
