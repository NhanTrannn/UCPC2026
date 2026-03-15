import type { RouteObject } from 'react-router-dom';
import GuestRoute from '../../app/guards/GuestRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export const authPublicRoutes: RouteObject[] = [
  {
    path: 'register',
    element: <RegisterPage />,
  },
  {
    path: 'login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
];
