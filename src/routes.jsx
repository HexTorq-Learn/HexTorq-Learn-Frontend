import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/layout/RouteGuards.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// These pages/shells pull in three.js / echarts-gl (heavy) — code-split so /learn and /login stay light.
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage.jsx'));
const AdminShell = lazy(() => import('./components/layout/AdminShell.jsx').then((m) => ({ default: m.AdminShell })));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage.jsx'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx'));
const AdminPlaylistsPage = lazy(() => import('./pages/admin/AdminPlaylistsPage.jsx'));
const AdminVideosPage = lazy(() => import('./pages/admin/AdminVideosPage.jsx'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage.jsx'));
const AdminUserDetailPage = lazy(() => import('./pages/admin/AdminUserDetailPage.jsx'));

function withSuspense(element) {
  return <Suspense fallback={<p className="muted">Loading...</p>}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
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
