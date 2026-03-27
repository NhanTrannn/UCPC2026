import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import AdminLayout from './AdminLayout';
import PublicLayout from './PublicLayout';
import UserLayout from './UserLayout';

function LayoutSwitch() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <PublicLayout />;
  }

  if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
    if (location.pathname === '/') {
      return <PublicLayout />;
    }

    return <AdminLayout />;
  }

  return <UserLayout />;
}

export default LayoutSwitch;
