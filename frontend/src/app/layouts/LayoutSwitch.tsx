import { useAppSelector } from '../redux/hooks';
import AdminLayout from './AdminLayout';
import PublicLayout from './PublicLayout';
import UserLayout from './UserLayout';

function LayoutSwitch() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <PublicLayout />;
  }

  if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
    return <AdminLayout />;
  }

  return <UserLayout />;
}

export default LayoutSwitch;
