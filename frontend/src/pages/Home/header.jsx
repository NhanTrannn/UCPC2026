import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../app/redux/auth.slice';
import { useAppDispatch, useAppSelector } from '../../app/redux/hooks';

const navLinks = [
  { href: '#News', label: 'Tin tức' },
  { href: '#Rules', label: 'Thể lệ' },
  { href: '#Pricing', label: 'Giải thưởng' },
  { href: '#Info', label: 'Thông tin' },
  { href: '#Investor', label: 'Nhà tài trợ' },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
    setProfileOpen(false);
    navigate('/', { replace: true });
  };

  const showTeamActions = isAuthenticated && user?.role === 'USER';
  const showAdminActions = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'STAFF');
  const showTeamRegistrationAction = showTeamActions && !user?.hasTeam;

  return (
    <div>
      <div className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="relative w-full px-4 md:px-10 flex h-16 items-center justify-between">
          {/* Logo + tên */}
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-zap h-6 w-6 text-purple-500"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              UCPC
            </span>
          </div>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-6">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-lg font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Auth actions + Hamburger */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative hidden sm:block" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-100 hover:border-zinc-500"
                >
                  <span>Xin chào, {user?.name || 'bạn'}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-sm font-semibold text-white">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-700 bg-zinc-900/95 p-2 shadow-2xl">
                    {showAdminActions && (
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        Dashboard
                      </Link>
                    )}
                    {showTeamActions && (
                      <Link
                        to="/user/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        Dashboard user
                      </Link>
                    )}
                    {showTeamRegistrationAction && (
                      <Link
                        to="/user"
                        onClick={() => setProfileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        Đăng ký team
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 h-10 px-4 py-2"
                >
                  Đăng ký
                </Link>
              </>
            )}
            {/* Hamburger - chỉ hiện trên mobile */}
            <button
              className="md:hidden flex flex-col justify-center items-center gap-1.5 w-8 h-8"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 w-6 bg-zinc-300 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-6 bg-zinc-300 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-6 bg-zinc-300 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-black/95 px-4 py-4 flex flex-col gap-3">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium text-zinc-300 hover:text-white transition-colors py-1"
              >
                {item.label}
              </a>
            ))}
            {isAuthenticated ? (
              <>
                <p className="text-sm text-zinc-300">Xin chào, {user?.name || 'bạn'}</p>
                {showAdminActions && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors py-1"
                  >
                    Dashboard
                  </Link>
                )}
                {showTeamActions && (
                  <Link
                    to="/user/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors py-1"
                  >
                    Dashboard user
                  </Link>
                )}
                {showTeamRegistrationAction && (
                  <Link
                    to="/user"
                    onClick={() => setMenuOpen(false)}
                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors py-1"
                  >
                    Đăng ký team
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-base font-medium text-zinc-300 hover:text-white transition-colors py-1"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-medium text-zinc-300 hover:text-white transition-colors py-1 sm:hidden"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-medium text-zinc-300 hover:text-white transition-colors py-1"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;
