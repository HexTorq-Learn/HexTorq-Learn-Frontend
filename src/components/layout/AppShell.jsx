import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main className={sidebarOpen ? 'app-shell' : 'app-shell collapsed'}>
      <Sidebar sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen((value) => !value)} />
      <section className="content">
        <Outlet />
      </section>
    </main>
  );
}
