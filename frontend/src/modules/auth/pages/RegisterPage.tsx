import { Form, Formik } from 'formik';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { loginSuccess } from '../../../app/redux/auth.slice';
import { useAppDispatch } from '../../../app/redux/hooks';
import {
    registerWithCredentials,
    resendRegisterVerification,
    verifyRegisterEmail,
} from '../../../services/auth.service';

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const registerValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .required('Tên người dùng là bắt buộc.')
    .min(3, 'Tên người dùng cần ít nhất 3 ký tự.')
    .max(30, 'Tên người dùng tối đa 30 ký tự.')
    .matches(/^[A-Za-zÀ-Ỹà-ỹ0-9_]+(?: [A-Za-zÀ-Ỹà-ỹ0-9_]+)*$/, 'Chỉ dùng chữ cái, chữ có dấu, số, dấu gạch dưới (_) và khoảng trắng giữa các từ.'),
  email: Yup.string()
    .trim()
    .required('Email là bắt buộc.')
    .email('Email không hợp lệ.'),
  password: Yup.string()
    .required('Mật khẩu là bắt buộc.')
    .min(8, 'Mật khẩu cần ít nhất 8 ký tự.')
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Mật khẩu cần có ít nhất 1 chữ và 1 số.'),
  confirmPassword: Yup.string()
    .required('Vui lòng nhập lại mật khẩu.')
    .oneOf([Yup.ref('password')], 'Mật khẩu nhập lại không khớp.'),
});

function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationUsername, setVerificationUsername] = useState('');
  const [verificationPin, setVerificationPin] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const initialValues: RegisterFormValues = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const isVerificationStep = Boolean(verificationEmail);

  const handleVerifyEmail = async () => {
    setVerificationStatus(null);

    if (!verificationPin.trim()) {
      setVerificationStatus('Vui lòng nhập mã PIN xác minh.');
      return;
    }

    setIsVerifying(true);
    try {
      const user = await verifyRegisterEmail({
        email: verificationEmail,
        pin: verificationPin.trim(),
      });
      dispatch(loginSuccess(user));
      navigate('/user', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác minh email thất bại';
      setVerificationStatus(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendPin = async () => {
    setVerificationStatus(null);
    setIsResending(true);
    try {
      await resendRegisterVerification(verificationEmail);
      setVerificationStatus('Đã gửi lại mã xác minh. Vui lòng kiểm tra email.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gửi lại mã thất bại';
      setVerificationStatus(message);
    } finally {
      setIsResending(false);
    }
  };

  const resetVerificationStep = () => {
    setVerificationEmail('');
    setVerificationUsername('');
    setVerificationPin('');
    setVerificationStatus(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1f2937] via-[#2f1b45] to-[#492a51] px-4 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-black/30 p-8 backdrop-blur">
        <h1 className="text-3xl font-bold text-center">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-zinc-300 text-center">Tạo tài khoản web để đăng ký đội thi.</p>

        {isVerificationStep ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-zinc-300">
              Mã xác minh đã gửi đến email <span className="font-semibold text-zinc-100">{verificationEmail}</span>.
            </p>
            <div>
              <label htmlFor="verify-pin" className="mb-1 block text-sm text-zinc-200">
                Mã PIN xác minh
              </label>
              <input
                id="verify-pin"
                type="text"
                value={verificationPin}
                onChange={(event) => setVerificationPin(event.target.value)}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition focus:border-pink-500"
                placeholder="Nhập 6 số"
              />
            </div>

            {verificationStatus && <p className="text-sm text-red-300">{verificationStatus}</p>}

            <button
              type="button"
              disabled={isVerifying}
              onClick={handleVerifyEmail}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 font-semibold transition hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
            >
              {isVerifying ? 'Đang xác minh...' : 'Xác minh email'}
            </button>

            <button
              type="button"
              disabled={isResending}
              onClick={handleResendPin}
              className="w-full rounded-lg border border-zinc-500 px-4 py-2 font-semibold text-zinc-100 transition hover:border-zinc-300 disabled:opacity-60"
            >
              {isResending ? 'Đang gửi lại...' : 'Gửi lại mã PIN'}
            </button>

            <button
              type="button"
              onClick={resetVerificationStep}
              className="w-full rounded-lg px-4 py-2 text-sm text-zinc-300 underline underline-offset-4 transition hover:text-zinc-100"
            >
              Đổi email đăng ký
            </button>

            <p className="text-center text-sm text-zinc-300">
              {verificationUsername ? `Tài khoản: ${verificationUsername}` : ''}
            </p>
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            validationSchema={registerValidationSchema}
            validateOnBlur={true}
            validateOnChange={true}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              setStatus(undefined);
              try {
                const registerResult = await registerWithCredentials({
                  username: values.username.trim(),
                  email: values.email.trim(),
                  password: values.password,
                });
                setVerificationEmail(registerResult.email);
                setVerificationUsername(registerResult.username);
                setVerificationStatus('Đăng ký thành công. Vui lòng nhập mã PIN từ email để xác minh.');
              } catch (submitError) {
                const message =
                  submitError instanceof Error ? submitError.message : 'Đăng ký thất bại';
                setStatus(message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, errors, touched, isSubmitting, status, handleChange, handleBlur }) => (
              <Form className="mt-6 space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1 block text-sm text-zinc-200">
                    Tên người dùng
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-lg border bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition ${
                      touched.username && errors.username
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-zinc-600 focus:border-pink-500'
                    }`}
                    placeholder="nguyenvana"
                  />
                  {touched.username && errors.username && (
                    <p className="mt-1 text-sm text-red-300">{errors.username}</p>
                  )}
                </div>

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

                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-sm text-zinc-200">
                    Nhập lại mật khẩu
                  </label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-lg border bg-zinc-900/70 px-3 py-2 outline-none ring-0 transition ${
                      touched.confirmPassword && errors.confirmPassword
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-zinc-600 focus:border-pink-500'
                    }`}
                    placeholder="••••••••"
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-300">{errors.confirmPassword}</p>
                  )}
                </div>

                {status && <p className="text-sm text-red-300">{status}</p>}

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
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;
