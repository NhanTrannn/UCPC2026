import { useNavigate } from 'react-router-dom';
import { logout } from '../app/redux/auth.slice';
import { useAppDispatch } from '../app/redux/hooks';
import { clearAccessToken } from '../services/http';

function LogoutButton() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAccessToken();
    dispatch(logout());
    navigate('/', { replace: true });
  };

  return (
    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      Đăng xuất
    </button>
  );
}

export default LogoutButton;
