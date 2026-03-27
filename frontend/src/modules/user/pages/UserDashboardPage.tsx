import { LoaderCircle, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useAppSelector } from '../../../app/redux/hooks';
import {
    changeUserPassword,
    deleteUserHelpRequest,
    getUserDashboardInfo,
    getUserHelpRequests,
    sendUserHelpRequest,
    uploadPaymentProof,
    type RegistrationStatus,
    type UserDashboardInfo,
    type UserHelpRequest,
} from '../../../services/user-dashboard.service';

function getStatusClass(status: RegistrationStatus): string {
  if (status === 'confirmed') {
    return 'border-emerald-300/40 bg-emerald-300/15 text-emerald-100';
  }

  if (status === 'pending') {
    return 'border-amber-300/40 bg-amber-300/15 text-amber-100';
  }

  return 'border-rose-300/40 bg-rose-300/15 text-rose-100';
}

function getStatusDescription(status: RegistrationStatus): string {
  if (status === 'confirmed') {
    return 'BTC đã xác nhận hồ sơ đăng ký của bạn.';
  }

  if (status === 'pending') {
    return 'Hồ sơ đã gửi, vui lòng chờ BTC xác nhận.';
  }

  return 'Bạn chưa hoàn tất gửi form đăng ký.';
}

function getTeamDisplay(teamName: string, role: string): { title: string; note?: string; isFallback: boolean } {
  const normalized = teamName.trim().toLowerCase();
  const normalizedRole = role.trim().toUpperCase();
  const isUnupdated = normalized.includes('not updated yet');
  const isAdminAccount = normalized.includes('admin account');

  // USER account should never surface admin fallback wording.
  if (normalizedRole === 'USER' && (isUnupdated || isAdminAccount)) {
    return {
      title: 'Chưa cập nhật đội thi',
      isFallback: true,
    };
  }

  if (isUnupdated && isAdminAccount) {
    return {
      title: 'Chưa cập nhật đội thi',
      note: 'Tài khoản admin, không thuộc đội thi.',
      isFallback: true,
    };
  }

  if (isUnupdated) {
    return {
      title: 'Chưa cập nhật đội thi',
      isFallback: true,
    };
  }

  if (isAdminAccount) {
    return {
      title: 'Tài khoản admin',
      note: 'Tài khoản này không tham gia đội thi.',
      isFallback: true,
    };
  }

  return {
    title: teamName,
    isFallback: false,
  };
}

function UserDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [data, setData] = useState<UserDashboardInfo | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordMessage, setPasswordMessage] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [helpTitle, setHelpTitle] = useState<string>('');
  const [helpContent, setHelpContent] = useState<string>('');
  const [helpMessage, setHelpMessage] = useState<string>('');
  const [helpErrorMessage, setHelpErrorMessage] = useState<string>('');
  const [isSubmittingHelp, setIsSubmittingHelp] = useState<boolean>(false);
  const [isLoadingHelpRequests, setIsLoadingHelpRequests] = useState<boolean>(false);
  const [helpRequests, setHelpRequests] = useState<UserHelpRequest[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const infoCardClass =
    'group relative overflow-hidden rounded-2xl border border-fuchsia-100/10 bg-slate-950/45 p-4 shadow-[0_12px_35px_rgba(28,12,46,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200/30 hover:bg-slate-950/65';

  useEffect(() => {
    if (!user?.id) {
      setErrorMessage('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const dashboard = await getUserDashboardInfo();
        if (isMounted) {
          setData(dashboard);
          if (dashboard.accountId) {
            void loadHelpRequests(dashboard.accountId);
          }
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Không thể tải dashboard user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const dashboard = await getUserDashboardInfo();
      setData(dashboard);
      if (dashboard.accountId) {
        await loadHelpRequests(dashboard.accountId);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải dashboard user');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHelpRequests = async (userId: number) => {
    setIsLoadingHelpRequests(true);
    setHelpErrorMessage('');

    try {
      const requests = await getUserHelpRequests(userId);
      setHelpRequests(requests);
    } catch (error) {
      setHelpErrorMessage(error instanceof Error ? error.message : 'Không thể tải yêu cầu hỗ trợ');
    } finally {
      setIsLoadingHelpRequests(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Mật khẩu mới nhập lại không khớp.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeUserPassword(oldPassword, newPassword);
      setPasswordMessage('Đổi mật khẩu thành công.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Không thể đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmitHelpRequest = async () => {
    setHelpMessage('');

    if (!data?.accountId) {
      setHelpMessage('Không xác định được tài khoản hiện tại.');
      return;
    }

    if (!helpTitle.trim() || !helpContent.trim()) {
      setHelpMessage('Vui lòng nhập tiêu đề và nội dung yêu cầu.');
      return;
    }

    setIsSubmittingHelp(true);
    try {
      await sendUserHelpRequest(helpTitle, helpContent);
      setHelpMessage('Đã gửi yêu cầu hỗ trợ thành công.');
      setHelpTitle('');
      setHelpContent('');
      await loadHelpRequests(data.accountId);
    } catch (error) {
      setHelpMessage(error instanceof Error ? error.message : 'Không thể gửi yêu cầu hỗ trợ');
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  const handleDeleteHelpRequest = async (requestId: number) => {
    if (!data?.accountId) {
      return;
    }

    setHelpMessage('');

    try {
      await deleteUserHelpRequest(requestId);
      setHelpMessage('Đã xóa yêu cầu hỗ trợ.');
      await loadHelpRequests(data.accountId);
    } catch (error) {
      setHelpMessage(error instanceof Error ? error.message : 'Không thể xóa yêu cầu hỗ trợ');
    }
  };

  const statusClass = useMemo(() => {
    if (!data) return getStatusClass('not-submitted');
    return getStatusClass(data.status);
  }, [data]);

  const teamDisplay = useMemo(() => {
    if (!data) {
      return {
        title: 'Chưa cập nhật đội thi',
        isFallback: true,
      };
    }

    return getTeamDisplay(data.teamName, data.role);
  }, [data]);

  const canResubmitProof = Boolean(
    data?.rejectionReason && data?.paymentLabel !== 'Đã xác nhận thanh toán'
  );

  const handlePickProofFile = () => {
    fileInputRef.current?.click();
  };

  const handleProofFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadMessage('');
    setIsUploadingProof(true);

    try {
      const toBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
          }

          reject(new Error('Không thể đọc file minh chứng'));
        };
        reader.onerror = () => reject(new Error('Không thể đọc file minh chứng'));
        reader.readAsDataURL(file);
      });

      await uploadPaymentProof(toBase64);
      setUploadMessage('Đã nộp lại minh chứng thành công. BTC sẽ kiểm tra lại hồ sơ của bạn.');
      await loadDashboard();
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'Không thể nộp lại minh chứng');
    } finally {
      setIsUploadingProof(false);
      event.target.value = '';
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#120c23]">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_620px_at_8%_-10%,rgba(192,132,252,0.2),transparent_58%),radial-gradient(850px_500px_at_92%_-6%,rgba(236,72,153,0.18),transparent_62%),linear-gradient(160deg,#1a0f34_0%,#271043_45%,#2e1540_100%)]" />
      <div className="pointer-events-none absolute -left-28 top-28 h-56 w-56 rounded-full bg-purple-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-64 w-64 rounded-full bg-pink-300/10 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 text-slate-100 md:px-6 md:py-20">
        <div className="rounded-3xl border border-fuchsia-100/20 bg-[#1b1030]/72 p-5 shadow-[0_22px_55px_rgba(20,8,38,0.55)] backdrop-blur-xl md:p-7">
          <div className="flex items-start">
            <div>
              <p className="inline-flex items-center rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-500/25 to-pink-500/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-100 shadow-[0_8px_26px_rgba(109,40,217,0.32)]">
                User Dashboard
              </p>
              <h1 className="mt-3 text-2xl font-extrabold text-white md:text-5xl md:leading-tight">
                Trạng thái đăng ký của bạn
              </h1>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-purple-100/25 bg-purple-300/15 px-3 py-2 text-sm text-purple-100">
              <LoaderCircle size={16} className="animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-rose-200/45 bg-rose-300/12 p-4 text-sm text-rose-100 shadow-[0_8px_24px_rgba(113,20,44,0.35)]">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && data ? (
            <div className="mt-7 space-y-5">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Tài khoản</p>
                <p className="mt-2 text-lg font-bold text-white">{data.username}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Mã tài khoản</p>
                <p className="mt-2 text-lg font-bold text-white">{data.accountId ?? 'Chưa cập nhật'}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Email</p>
                <p className="mt-2 text-base font-semibold text-slate-100 break-all">{data.email}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Vai trò</p>
                <p className="mt-2 text-lg font-bold text-white">{data.role}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Đội hiện tại</p>
                <p className="mt-2 text-base font-semibold text-white">{teamDisplay.title}</p>
                {teamDisplay.note ? (
                  <p className="mt-1 text-xs text-purple-100/80">{teamDisplay.note}</p>
                ) : null}
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Người đại diện</p>
                <p className="mt-2 text-base font-semibold text-white">{data.trainerName}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Khối thi</p>
                <p className="mt-2 text-base font-semibold text-white">{data.blockLabel}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Số thành viên</p>
                <p className="mt-2 text-lg font-bold text-white">{data.participantCount}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Trạng thái hồ sơ</p>
                <p className="mt-2 text-base font-semibold text-white">{data.updateLabel}</p>
              </article>
              <article className={infoCardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/75">Trạng thái thanh toán</p>
                <p className="mt-2 text-base font-semibold text-white">{data.paymentLabel}</p>
              </article>
              </div>

              {data.rejectionReason ? (
                <article className="rounded-2xl border border-rose-200/35 bg-rose-300/10 p-4 shadow-[0_10px_24px_rgba(136,19,55,0.25)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-100/90">Lý do từ chối minh chứng</p>
                  <p className="mt-2 text-sm text-rose-100">{data.rejectionReason}</p>

                  {canResubmitProof ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => void handleProofFileChange(event)}
                      />
                      <button
                        type="button"
                        onClick={handlePickProofFile}
                        disabled={isUploadingProof}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/40 bg-emerald-300/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUploadingProof ? <LoaderCircle size={13} className="animate-spin" /> : <Upload size={13} />}
                        {isUploadingProof ? 'Đang nộp lại...' : 'Nộp lại minh chứng'}
                      </button>
                      {uploadMessage ? <p className="text-xs text-slate-200">{uploadMessage}</p> : null}
                    </div>
                  ) : null}
                </article>
              ) : null}

              <article className="rounded-2xl border border-purple-100/20 bg-gradient-to-r from-[#30114a]/75 to-[#431551]/75 p-4 md:p-5 shadow-[0_14px_36px_rgba(44,15,69,0.45)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/80">Tình trạng form đăng ký</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass}`}>
                    {data.statusLabel}
                  </span>
                  {data.status !== 'not-submitted' ? (
                    <span className="text-sm text-slate-200">{getStatusDescription(data.status)}</span>
                  ) : null}
                </div>
              </article>

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-purple-100/20 bg-slate-950/45 p-4 shadow-[0_14px_36px_rgba(44,15,69,0.35)] md:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/80">Đổi mật khẩu</p>
                  <div className="mt-3 space-y-2.5">
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(event) => setOldPassword(event.target.value)}
                      placeholder="Mật khẩu hiện tại"
                      className="w-full rounded-lg border border-purple-100/20 bg-[#221236] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-pink-400"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Mật khẩu mới"
                      className="w-full rounded-lg border border-purple-100/20 bg-[#221236] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-pink-400"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full rounded-lg border border-purple-100/20 bg-[#221236] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-pink-400"
                    />
                    <button
                      type="button"
                      onClick={() => void handleChangePassword()}
                      disabled={isChangingPassword}
                      className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-cyan-700 disabled:opacity-60"
                    >
                      {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                    {passwordMessage ? <p className="text-xs text-slate-200">{passwordMessage}</p> : null}
                  </div>
                </article>

                <article className="rounded-2xl border border-purple-100/20 bg-slate-950/45 p-4 shadow-[0_14px_36px_rgba(44,15,69,0.35)] md:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/80">Gửi yêu cầu hỗ trợ</p>
                  <div className="mt-3 space-y-2.5">
                    <input
                      type="text"
                      value={helpTitle}
                      onChange={(event) => setHelpTitle(event.target.value)}
                      placeholder="Tiêu đề yêu cầu"
                      className="w-full rounded-lg border border-purple-100/20 bg-[#221236] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-pink-400"
                    />
                    <textarea
                      value={helpContent}
                      onChange={(event) => setHelpContent(event.target.value)}
                      rows={4}
                      placeholder="Mô tả chi tiết vấn đề của bạn"
                      className="w-full rounded-lg border border-purple-100/20 bg-[#221236] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-pink-400"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSubmitHelpRequest()}
                      disabled={isSubmittingHelp}
                      className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-60"
                    >
                      {isSubmittingHelp ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>
                    {helpMessage ? <p className="text-xs text-slate-200">{helpMessage}</p> : null}
                  </div>
                </article>
              </div>

              <article className="rounded-2xl border border-purple-100/20 bg-slate-950/45 p-4 shadow-[0_14px_36px_rgba(44,15,69,0.35)] md:p-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/80">Lịch sử yêu cầu hỗ trợ</p>

                {isLoadingHelpRequests ? (
                  <div className="inline-flex items-center gap-2 rounded-md border border-purple-100/25 bg-purple-200/10 px-3 py-2 text-xs text-purple-100">
                    <LoaderCircle size={14} className="animate-spin" />
                    Đang tải yêu cầu hỗ trợ...
                  </div>
                ) : null}

                {!isLoadingHelpRequests && helpErrorMessage ? (
                  <p className="rounded-lg border border-rose-200/35 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">
                    {helpErrorMessage}
                  </p>
                ) : null}

                {!isLoadingHelpRequests && !helpErrorMessage && helpRequests.length === 0 ? (
                  <p className="rounded-lg border border-purple-100/20 bg-purple-200/10 px-3 py-2 text-sm text-slate-200">
                    Chưa có yêu cầu hỗ trợ nào.
                  </p>
                ) : null}

                {!isLoadingHelpRequests && !helpErrorMessage && helpRequests.length > 0 ? (
                  <div className="space-y-2">
                    {helpRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-purple-100/20 bg-[#261236]/35 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{request.title}</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                              request.isSolved
                                ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-100'
                                : 'border-amber-300/40 bg-amber-300/15 text-amber-100'
                            }`}
                          >
                            {request.isSolved ? 'Đã xử lý' : 'Chờ xử lý'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-200">{request.content}</p>
                        <p className="mt-2 text-xs text-purple-100/90">Phản hồi BTC: {request.response}</p>
                        <button
                          type="button"
                          onClick={() => void handleDeleteHelpRequest(request.id)}
                          className="mt-2 rounded-md border border-rose-300/40 bg-rose-300/15 px-2.5 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/25"
                        >
                          Xóa yêu cầu
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="rounded-2xl border border-purple-100/20 bg-slate-950/45 p-4 shadow-[0_14px_36px_rgba(44,15,69,0.35)] md:p-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100/80">Danh sách thành viên đội thi</p>

                {data.participants.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-purple-100/20">
                    <table className="min-w-full border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="bg-purple-100/12 text-left text-purple-100">
                          <th className="border-b border-purple-100/20 px-3 py-2.5 font-semibold">Họ tên</th>
                          <th className="border-b border-purple-100/20 px-3 py-2.5 font-semibold">CCCD</th>
                          <th className="border-b border-purple-100/20 px-3 py-2.5 font-semibold">SĐT</th>
                          <th className="border-b border-purple-100/20 px-3 py-2.5 font-semibold">Ngày sinh</th>
                          <th className="border-b border-purple-100/20 px-3 py-2.5 font-semibold">Trường</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.participants.map((member, index) => (
                          <tr
                            key={member.id ?? `member-${index}`}
                            className="border-b border-purple-100/12 text-slate-100 odd:bg-[#261236]/45 even:bg-[#24122f]/20"
                          >
                            <td className="px-3 py-2.5">{member.fullName}</td>
                            <td className="px-3 py-2.5">{member.citizenId}</td>
                            <td className="px-3 py-2.5">{member.phone}</td>
                            <td className="px-3 py-2.5">{member.birth}</td>
                            <td className="px-3 py-2.5">{member.schoolName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-lg border border-purple-100/20 bg-purple-200/10 px-3 py-2.5 text-sm text-slate-200">
                    Chưa có dữ liệu thành viên đội thi.
                  </p>
                )}
              </article>
            </div>
          ) : (
            !isLoading && !errorMessage ? (
              <div className="mt-6 rounded-xl border border-purple-100/20 bg-slate-950/45 p-4 text-sm text-slate-200">
                Chưa có dữ liệu hồ sơ để hiển thị. Bạn có thể bắt đầu đăng ký đội tại form đăng ký.
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboardPage;
