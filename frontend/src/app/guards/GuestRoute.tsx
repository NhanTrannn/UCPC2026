import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

interface GuestRouteProps {
  children: ReactNode;
}

function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
}

export default GuestRoute;
