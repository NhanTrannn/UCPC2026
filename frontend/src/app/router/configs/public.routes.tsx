import type { RouteObject } from 'react-router-dom';
import { authPublicRoutes } from '../../../modules/auth/routes';
import { homePublicRoutes } from '../../../modules/home/routes';

export const publicRoutes: RouteObject[] = [
	...homePublicRoutes,
	...authPublicRoutes,
];
