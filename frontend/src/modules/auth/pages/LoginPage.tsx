import { Form, Formik } from 'formik';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { loginSuccess } from '../../../app/redux/auth.slice';
import { useAppDispatch } from '../../../app/redux/hooks';
import {
    forgotPassword,
    loginWithCredentials,
    resetPasswordByPin,
} from '../../../services/auth.service';

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
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [isSendingPin, setIsSendingPin] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [recoveryRequestMessage, setRecoveryRequestMessage] = useState('');
  const [recoveryResetMessage, setRecoveryResetMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const initialValues: LoginFormValues = {
    email: '',
    password: '',
  };

  const handleSendPin = async () => {
    setRecoveryRequestMessage('');
    setRecoveryResetMessage('');

    if (!recoveryEmail.trim()) {
      setRecoveryRequestMessage('Vui lòng nhập email để nhận PIN.');
      return;
    }

    setIsSendingPin(true);

    try {
      await forgotPassword(recoveryEmail.trim());
      setRecoveryRequestMessage('Đã gửi PIN về email. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (error) {
      setRecoveryRequestMessage(error instanceof Error ? error.message : 'Gửi PIN thất bại');
    } finally {
      setIsSendingPin(false);
    }
  };

  const handleResetPassword = async () => {
    setRecoveryResetMessage('');

    if (!recoveryEmail.trim() || !recoveryPin.trim() || !recoveryNewPassword) {
      setRecoveryResetMessage('Vui lòng nhập đủ email, PIN và mật khẩu mới.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryResetMessage('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsResettingPassword(true);

    try {
      await resetPasswordByPin({
        email: recoveryEmail.trim(),
        pin: recoveryPin.trim(),
        newPassword: recoveryNewPassword,
      });
      setShowSuccessModal(true);
      setRecoveryPin('');
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
    } catch (error) {
      setRecoveryResetMessage(error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại');
    } finally {
      setIsResettingPassword(false);
    }
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

              <button
                type="button"
                onClick={() => setShowRecoveryPanel((current) => !current)}
                className="w-full rounded-lg border border-zinc-500/70 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-pink-400 hover:text-pink-200"
              >
                {showRecoveryPanel ? 'Ẩn quên mật khẩu' : 'Quên mật khẩu?'}
              </button>

              {showRecoveryPanel ? (
                <div className="rounded-lg border border-zinc-600 bg-zinc-900/55 p-3">
                  <p className="text-sm font-semibold text-zinc-100">Khôi phục mật khẩu bằng PIN</p>

                  <label htmlFor="recovery-email" className="mt-3 block text-xs text-zinc-300">
                    Email tài khoản
                  </label>
                  <input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm outline-none transition focus:border-pink-500"
                    placeholder="you@example.com"
                  />

                  <button
                    type="button"
                    onClick={() => void handleSendPin()}
                    disabled={isSendingPin}
                    className="mt-2 w-full rounded-lg border border-sky-400/70 bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-60"
                  >
                    {isSendingPin ? 'Đang gửi PIN...' : 'Gửi PIN về email'}
                  </button>

                  {recoveryRequestMessage ? (
                    <p className="mt-2 text-xs text-zinc-200">{recoveryRequestMessage}</p>
                  ) : null}

                  <div className="mt-3 space-y-2 border-t border-zinc-700 pt-3">
                    <input
                      type="text"
                      value={recoveryPin}
                      onChange={(event) => setRecoveryPin(event.target.value)}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm outline-none transition focus:border-pink-500"
                      placeholder="Mã PIN 6 số"
                    />
                    <input
                      type="password"
                      value={recoveryNewPassword}
                      onChange={(event) => setRecoveryNewPassword(event.target.value)}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm outline-none transition focus:border-pink-500"
                      placeholder="Mật khẩu mới"
                    />
                    <input
                      type="password"
                      value={recoveryConfirmPassword}
                      onChange={(event) => setRecoveryConfirmPassword(event.target.value)}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm outline-none transition focus:border-pink-500"
                      placeholder="Nhập lại mật khẩu mới"
                    />

                    <button
                      type="button"
                      onClick={() => void handleResetPassword()}
                      disabled={isResettingPassword}
                      className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-sm font-semibold transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
                    >
                      {isResettingPassword ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                    </button>

                    {recoveryResetMessage ? (
                      <p className="text-xs text-zinc-200">{recoveryResetMessage}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 to-teal-950 p-8 shadow-2xl">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-500/20 p-4">
                <svg
                  className="h-12 w-12 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="mt-4 text-center text-2xl font-bold text-emerald-300">
              Thành công!
            </h2>

            <p className="mt-3 text-center text-sm text-emerald-100">
              Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập lại với mật khẩu mới.
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setShowRecoveryPanel(false);
              }}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 font-semibold text-white transition hover:from-emerald-700 hover:to-teal-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
