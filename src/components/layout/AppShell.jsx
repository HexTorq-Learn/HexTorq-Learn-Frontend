import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';

export function AppShell() {
  return (
    <main className="app-shell">
      <Sidebar />
      <section className="content">
        <Outlet />
      </section>
    </main>
  );
}
