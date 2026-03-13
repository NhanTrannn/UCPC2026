import type { RouteObject } from 'react-router-dom';
import GuestRoute from '../../app/guards/GuestRoute';
import LoginPage from './pages/LoginPage';

export const authPublicRoutes: RouteObject[] = [
  {
    path: 'login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
];
