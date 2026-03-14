import type { RouteObject } from 'react-router-dom';
import HomePage from './pages/HomePage';

export const homePublicRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
];
