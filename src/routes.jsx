import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/layout/RouteGuards.jsx';
import { RouteErrorBoundary } from './components/layout/RouteErrorBoundary.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'ChunkLoadError',
  'error loading dynamically imported module',
];

function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function lazyWithReload(loader) {
  return lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      const key = 'hextorq-learn:lazy-reload';
      if (isChunkLoadError(error) && sessionStorage.getItem(key) !== window.location.href) {
        sessionStorage.setItem(key, window.location.href);
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

// These pages/shells pull in three.js / echarts-gl (heavy) — code-split so /learn and /login stay light.
const AnalyticsPage = lazyWithReload(() => import('./pages/AnalyticsPage.jsx'));
const LeaderboardPage = lazyWithReload(() => import('./pages/LeaderboardPage.jsx'));
const AdminShell = lazyWithReload(() => import('./components/layout/AdminShell.jsx').then((m) => ({ default: m.AdminShell })));
const AdminOverviewPage = lazyWithReload(() => import('./pages/admin/AdminOverviewPage.jsx'));
const AdminUsersPage = lazyWithReload(() => import('./pages/admin/AdminUsersPage.jsx'));
const AdminPlaylistsPage = lazyWithReload(() => import('./pages/admin/AdminPlaylistsPage.jsx'));
const AdminVideosPage = lazyWithReload(() => import('./pages/admin/AdminVideosPage.jsx'));
const AdminAnalyticsPage = lazyWithReload(() => import('./pages/admin/AdminAnalyticsPage.jsx'));
const AdminUserDetailPage = lazyWithReload(() => import('./pages/admin/AdminUserDetailPage.jsx'));

function withSuspense(element) {
  return <Suspense fallback={<p className="muted">Loading...</p>}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    errorElement: <RouteErrorBoundary />,
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/learn', element: <LearnPage /> },
          { path: '/learn/:videoId', element: <LearnPage /> },
          { path: '/analytics', element: withSuspense(<AnalyticsPage />) },
          { path: '/leaderboard', element: withSuspense(<LeaderboardPage />) },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/admin',
            element: withSuspense(<AdminShell />),
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              { path: 'overview', element: withSuspense(<AdminOverviewPage />) },
              { path: 'users', element: withSuspense(<AdminUsersPage />) },
              { path: 'users/:userId', element: withSuspense(<AdminUserDetailPage />) },
              { path: 'playlists', element: withSuspense(<AdminPlaylistsPage />) },
              { path: 'videos', element: withSuspense(<AdminVideosPage />) },
              { path: 'analytics', element: withSuspense(<AdminAnalyticsPage />) },
            ],
          },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/learn" replace /> },
  { path: '*', element: <NotFoundPage /> },
]);
