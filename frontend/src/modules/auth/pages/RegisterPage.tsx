import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../../app/redux/auth.slice';
import { useAppDispatch } from '../../../app/redux/hooks';
import { registerWithCredentials } from '../../../services/auth.service';

function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await registerWithCredentials({ username, email, password });
      dispatch(loginSuccess(user));
      navigate('/user', { replace: true });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Đăng ký thất bại';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1f2937] via-[#2f1b45] to-[#492a51] px-4 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-black/30 p-8 backdrop-blur">
        <h1 className="text-3xl font-bold">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-zinc-300">Tạo tài khoản web để đăng ký đội thi.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm text-zinc-200">
              Tên người dùng
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition focus:border-pink-500"
              placeholder="nguyenvana"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-zinc-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition focus:border-pink-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-zinc-200">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition focus:border-pink-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm text-zinc-200">
              Nhập lại mật khẩu
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition focus:border-pink-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 font-semibold transition hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
          </button>

          <p className="text-center text-sm text-zinc-300">
            Đã có tài khoản?{' '}
            <Link className="font-semibold text-pink-300 hover:text-pink-200" to="/login">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
