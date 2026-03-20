import { Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { loginSuccess } from '../../../app/redux/auth.slice';
import { useAppDispatch } from '../../../app/redux/hooks';
import { loginWithCredentials } from '../../../services/auth.service';

type LoginFormValues = {
  email: string;
  password: string;
};

const loginValidationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .required('Email là bắt buộc.')
    .email('Email không hợp lệ.'),
  password: Yup.string().required('Mật khẩu là bắt buộc.'),
});

function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const initialValues: LoginFormValues = {
    email: '',
    password: '',
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1f2937] via-[#2f1b45] to-[#492a51] px-4 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-black/30 p-8 backdrop-blur">
        <h1 className="text-3xl font-bold">Đăng nhập</h1>
        <p className="mt-2 text-sm text-zinc-300">Đăng nhập bằng tài khoản đã tạo để vào khu vực người dùng.</p>

        <Formik
          initialValues={initialValues}
          validationSchema={loginValidationSchema}
          validateOnBlur={true}
          validateOnChange={true}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(undefined);
            try {
              const user = await loginWithCredentials({
                email: values.email.trim(),
                password: values.password,
              });
              dispatch(loginSuccess(user));
              navigate('/', { replace: true });
            } catch (submitError) {
              const message =
                submitError instanceof Error ? submitError.message : 'Đăng nhập thất bại';
              setStatus(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, isSubmitting, status, handleBlur, handleChange }) => (
            <Form className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-zinc-200">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-lg border bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition ${
                    touched.email && errors.email
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-zinc-600 focus:border-pink-500'
                  }`}
                  placeholder="you@example.com"
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-sm text-red-300">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-zinc-200">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-lg border bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition ${
                    touched.password && errors.password
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-zinc-600 focus:border-pink-500'
                  }`}
                  placeholder="••••••••"
                />
                {touched.password && errors.password && (
                  <p className="mt-1 text-sm text-red-300">{errors.password}</p>
                )}
              </div>

              {status && <p className="text-sm text-red-300">{status}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 font-semibold transition hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <p className="text-center text-sm text-zinc-300">
                Chưa có tài khoản?{' '}
                <Link className="font-semibold text-pink-300 hover:text-pink-200" to="/register">
                  Đăng ký ngay
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default LoginPage;
