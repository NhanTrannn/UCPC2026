import { Navigate, type RouteObject } from 'react-router-dom';
import LayoutSwitch from '../layouts/LayoutSwitch';
import { adminRoutes } from './configs/admin.routes';
import { publicRoutes } from './configs/public.routes';
import { userRoutes } from './configs/user.routes';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <LayoutSwitch />,
    children: [
      ...publicRoutes,
      ...userRoutes,
      ...adminRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
];
