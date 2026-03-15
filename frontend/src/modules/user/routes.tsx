import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../../app/guards/ProtectedRoute';
import UserPage from './pages/UserPage';

export const userModuleRoutes: RouteObject[] = [
  {
    path: 'user',
    element: (
      <ProtectedRoute>
        <UserPage />
      </ProtectedRoute>
    ),
  },
];
