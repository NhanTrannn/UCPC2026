import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../../app/guards/ProtectedRoute';
import AdminAccountsPage from './pages/AdminAccountsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminTeamsPage from './pages/AdminTeamsPage';

export const adminModuleRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'dashboard/teams',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
        <AdminTeamsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'dashboard/accounts',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
        <AdminAccountsPage />
      </ProtectedRoute>
    ),
  },
];
