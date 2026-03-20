import { Bell, Home, LayoutDashboard, ShieldCheck, UserRound, Users, Users2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import LogoutButton from '../../components/LogoutButton';
import { useAppSelector } from '../redux/hooks';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: '/dashboard/teams',
    label: 'Thông tin các đội',
    icon: Users2,
    exact: true,
  },
  {
    to: '/dashboard/accounts',
    label: 'Thông tin tài khoản',
    icon: UserRound,
    exact: true,
  },
  {
    to: '/',
    label: 'Trang chủ',
    icon: Home,
    exact: true,
  },
];

function AdminLayout() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(74,144,226,0.22),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(46,204,113,0.18),transparent_45%),linear-gradient(150deg,#08111f,#0d1b2a_45%,#10253d)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1400px] gap-5 px-4 py-5 md:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="rounded-xl bg-slate-900/65 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/90">UCPC Admin</p>
            <h2 className="mt-2 text-xl font-bold">Control Center</h2>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck size={16} className="text-emerald-300" />
              <span>{user?.role ?? 'ADMIN'} session</span>
            </div>
          </div>

          <nav className="mt-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                      isActive
                        ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100'
                        : 'border-white/10 bg-slate-900/35 text-slate-200 hover:border-cyan-300/40 hover:bg-cyan-300/10'
                    }`
                  }
                >
                  <Icon size={17} />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Tài khoản đăng nhập</p>
            <p className="mt-1 truncate">{user?.name ?? 'Quản trị viên'}</p>
          </div>

          <div className="mt-3">
            <LogoutButton />
          </div>
        </aside>

        <main className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/35 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Hệ thống quản trị</p>
              <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold">
                <Users size={18} className="text-cyan-300" />
                Quản lý đội thi UCPC
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-cyan-200/30 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
              <Bell size={14} />
              <span>Đang hoạt động</span>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
