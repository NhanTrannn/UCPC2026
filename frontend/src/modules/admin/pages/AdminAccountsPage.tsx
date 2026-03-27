import { AlertTriangle, ChevronDown, ChevronRight, LoaderCircle, Trash2 } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteAdminAccount,
  getAdminAccountDetail,
  getAdminAccounts,
  type AdminAccountDetail,
  type AdminAccountRow,
} from '../../../services/admin-dashboard.service';
import { exportRowsToExcel } from '../../../utils/excel';

function renderProcessStatus(detail?: AdminAccountDetail): string {
  if (!detail) {
    return 'Chưa tải';
  }

  const hasNoTeamData = detail.teamName === 'Chưa cập nhật' && (detail.participants?.length ?? 0) === 0;
  if (hasNoTeamData && detail.isUpdate !== true) {
    return 'Chưa đăng ký đội';
  }

  if (detail.isUpdate === true && detail.isPaid === true) {
    return 'Đã duyệt';
  }

  if (detail.isUpdate === true) {
    return 'Chờ duyệt';
  }

  return 'Khởi tạo';
}

function renderRepresentative(detail?: AdminAccountDetail): string {
  if (!detail?.representativeName) {
    return 'Chưa cập nhật';
  }

  if (detail.representativeRole === 'LEADER') {
    return `${detail.representativeName} (LEADER)`;
  }

  if (detail.representativeRole === 'COACH') {
    return `${detail.representativeName} (COACH)`;
  }

  return detail.representativeName;
}

function getTeamBlockLabel(isHighSchool: boolean | null): string {
  if (isHighSchool === true) {
    return 'THPT';
  }

  if (isHighSchool === false) {
    return 'Đại học';
  }

  return 'Chưa cập nhật';
}

function dedupeAdminAccountsByEmail(rows: AdminAccountRow[]): AdminAccountRow[] {
  const seenAdminEmails = new Set<string>();

  return rows.filter((row) => {
    if (row.role !== 'ADMIN') {
      return true;
    }

    const normalizedEmail = row.email.trim().toLowerCase();

    if (seenAdminEmails.has(normalizedEmail)) {
      return false;
    }

    seenAdminEmails.add(normalizedEmail);
    return true;
  });
}

function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [detailByUserId, setDetailByUserId] = useState<Record<number, AdminAccountDetail>>({});
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortFilter, setSortFilter] = useState<string>('USERNAME_ASC');
  const [detailLoadingUserId, setDetailLoadingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState<AdminAccountRow | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isDeleteNameMatched = pendingDeleteAccount
    ? deleteConfirmInput.trim() === pendingDeleteAccount.username
    : false;

  const filteredAccounts = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    const result = accounts.filter((account) => {
      const roleMatched = roleFilter === 'ALL' || account.role === roleFilter;

      if (!roleMatched) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return [account.username, account.email, account.teamName].some((value) =>
        value.toLowerCase().includes(normalizedKeyword)
      );
    });

    return result.sort((left, right) => {
      if (sortFilter === 'USERNAME_DESC') {
        return right.username.localeCompare(left.username, 'vi');
      }

      if (sortFilter === 'EMAIL_ASC') {
        return left.email.localeCompare(right.email, 'vi');
      }

      if (sortFilter === 'EMAIL_DESC') {
        return right.email.localeCompare(left.email, 'vi');
      }

      if (sortFilter === 'ROLE_ASC') {
        return left.role.localeCompare(right.role, 'vi');
      }

      if (sortFilter === 'ROLE_DESC') {
        return right.role.localeCompare(left.role, 'vi');
      }

      return left.username.localeCompare(right.username, 'vi');
    });
  }, [accounts, roleFilter, searchKeyword, sortFilter]);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getAdminAccounts();
      const normalizedData = dedupeAdminAccountsByEmail(data);

      setAccounts(normalizedData);
      setExpandedUserId((current) =>
        current && normalizedData.some((item) => item.id === current) ? current : null
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleToggleExpand = useCallback(async (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    if (detailByUserId[userId]) {
      return;
    }

    setDetailLoadingUserId(userId);
    try {
      const detail = await getAdminAccountDetail(userId);
      setDetailByUserId((prev) => ({
        ...prev,
        [userId]: detail,
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết tài khoản');
    } finally {
      setDetailLoadingUserId(null);
    }
  }, [detailByUserId, expandedUserId]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const handleExportAccounts = useCallback(() => {
    const rows = filteredAccounts.map((account, index) => ({
      STT: index + 1,
      TenDangNhap: account.username,
      Email: account.email,
      VaiTro: account.role,
      DoiHienTai: account.teamName,
    }));

    exportRowsToExcel(rows, 'ucpc-thong-tin-tai-khoan.xlsx', 'Thong tin tai khoan');
  }, [filteredAccounts]);

  const handleRequestDeleteAccount = useCallback((account: AdminAccountRow) => {
    setPendingDeleteAccount(account);
    setDeleteConfirmInput('');
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    if (deletingUserId !== null) {
      return;
    }

    setPendingDeleteAccount(null);
    setDeleteConfirmInput('');
  }, [deletingUserId]);

  const handleDeleteAccount = useCallback(async (account: AdminAccountRow) => {
    setDeletingUserId(account.id);

    try {
      await deleteAdminAccount(account.id);

      setAccounts((prev) => prev.filter((item) => item.id !== account.id));
      setDetailByUserId((prev) => {
        const next = { ...prev };
        delete next[account.id];
        return next;
      });

      if (expandedUserId === account.id) {
        setExpandedUserId(null);
      }

      setPendingDeleteAccount(null);
      setDeleteConfirmInput('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Xóa tài khoản thất bại');
    } finally {
      setDeletingUserId(null);
    }
  }, [expandedUserId]);

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Thông tin tài khoản</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300">
            Hiển thị: {filteredAccounts.length.toLocaleString('vi-VN')}/{accounts.length.toLocaleString('vi-VN')} tài khoản
          </span>
          <button
            type="button"
            onClick={handleExportAccounts}
            disabled={filteredAccounts.length === 0}
            className="rounded-lg border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Data
          </button>
          <button
            type="button"
            onClick={() => void loadAccounts()}
            className="rounded-lg border border-cyan-300/40 bg-cyan-300/15 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/25"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle size={14} className="animate-spin" />
                Đang tải
              </span>
            ) : (
              'Tải lại dữ liệu'
            )}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">
          <p className="font-semibold">Không thể tải danh sách tài khoản</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_220px_220px]">
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="Tìm tên đăng nhập, email, đội..."
          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
        />
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="ADMIN">ADMIN</option>
          <option value="STAFF">STAFF</option>
          <option value="USER">USER</option>
        </select>
        <select
          value={sortFilter}
          onChange={(event) => setSortFilter(event.target.value)}
          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
        >
          <option value="USERNAME_ASC">Tên đăng nhập A-Z</option>
          <option value="USERNAME_DESC">Tên đăng nhập Z-A</option>
          <option value="EMAIL_ASC">Email A-Z</option>
          <option value="EMAIL_DESC">Email Z-A</option>
          <option value="ROLE_ASC">Vai trò A-Z</option>
          <option value="ROLE_DESC">Vai trò Z-A</option>
        </select>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border border-white/10 text-left text-slate-300">
              <th className="border border-white/10 px-3 py-2">Tên đăng nhập</th>
              <th className="border border-white/10 px-3 py-2">Email</th>
              <th className="border border-white/10 px-3 py-2">Vai trò</th>
              <th className="border border-white/10 px-3 py-2">Đội hiện tại</th>
              <th className="border border-white/10 px-3 py-2 text-right">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => {
                const detail = detailByUserId[account.id];
                const isExpanded = expandedUserId === account.id;
                const isDetailLoading = detailLoadingUserId === account.id;

                return (
                  <Fragment key={account.id}>
                    <tr
                      onClick={() => void handleToggleExpand(account.id)}
                      className="border border-white/10 cursor-pointer bg-slate-900/45 text-slate-100 hover:bg-slate-800/55"
                    >
                      <td className="border border-white/10 px-3 py-2 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          {account.username}
                        </span>
                      </td>
                      <td className="border border-white/10 px-3 py-2">{account.email}</td>
                      <td className="border border-white/10 px-3 py-2">{account.role}</td>
                      <td className="border border-white/10 px-3 py-2">{account.teamName}</td>
                      <td className="border border-white/10 px-3 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteAccount(account)}
                          disabled={account.role === 'ADMIN' || deletingUserId === account.id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-rose-300/30 bg-rose-300/15 px-2.5 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingUserId === account.id ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          Xóa
                        </button>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr className="bg-slate-950/50 text-slate-200">
                        <td colSpan={5} className="px-4 py-3">
                          {isDetailLoading ? (
                            <div className="inline-flex items-center gap-2 text-sm text-slate-300">
                              <LoaderCircle size={15} className="animate-spin" />
                              Đang tải chi tiết tài khoản...
                            </div>
                          ) : (
                            <div className="space-y-3 rounded-lg border border-white/10 bg-slate-900/45 p-3">
                              <div className="grid gap-2 text-sm md:grid-cols-2">
                                <p>
                                  <span className="font-semibold text-slate-100">Trạng thái hồ sơ:</span> {renderProcessStatus(detail)}
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-100">Khối thi:</span> {getTeamBlockLabel(detail?.isHighSchool ?? null)}
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-100">Người đại diện (role):</span> {renderRepresentative(detail)}
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-100">Đã thanh toán:</span> {detail?.isPaid ? 'Rồi' : 'Chưa'}
                                </p>
                              </div>

                              <div>
                                <p className="mb-2 text-sm font-semibold text-slate-100">
                                  Thành viên đội ({detail?.participants?.length ?? 0})
                                </p>

                                {detail?.participants && detail.participants.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse text-xs">
                                      <thead>
                                        <tr className="border border-white/10 text-left text-slate-300">
                                          <th className="border border-white/10 px-2 py-1">Họ tên</th>
                                          <th className="border border-white/10 px-2 py-1">CCCD</th>
                                          <th className="border border-white/10 px-2 py-1">SĐT</th>
                                          <th className="border border-white/10 px-2 py-1">Ngày sinh</th>
                                          <th className="border border-white/10 px-2 py-1">Trường</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {detail.participants.map((member) => (
                                          <tr key={member.id} className="border border-white/10 text-slate-200">
                                            <td className="border border-white/10 px-2 py-1">{member.fullName || 'Chưa cập nhật'}</td>
                                            <td className="border border-white/10 px-2 py-1">{member.citizenId || 'Chưa cập nhật'}</td>
                                            <td className="border border-white/10 px-2 py-1">{member.phone || 'Chưa cập nhật'}</td>
                                            <td className="border border-white/10 px-2 py-1">{member.birth || 'Chưa cập nhật'}</td>
                                            <td className="border border-white/10 px-2 py-1">{member.schoolName || 'Chưa cập nhật'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-300">Tài khoản chưa có dữ liệu thành viên.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <tr className="border border-white/10">
                <td colSpan={5} className="border border-white/10 px-3 py-4 text-center text-slate-300">
                  {isLoading ? 'Đang tải danh sách tài khoản...' : 'Chưa có dữ liệu tài khoản.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingDeleteAccount ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={handleCloseDeleteModal}>
          <div
            className="w-full max-w-lg rounded-2xl border border-rose-300/35 bg-slate-950 p-5 text-slate-100 shadow-[0_30px_90px_-20px_rgba(251,113,133,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl border border-rose-300/35 bg-rose-300/15 p-2 text-rose-200">
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="text-base font-semibold">Xóa tài khoản</p>
                <p className="mt-1 text-sm text-slate-300">
                  Hành động này sẽ xóa tài khoản và toàn bộ dữ liệu liên quan. Không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-slate-900/50 p-3 text-sm">
              <p>
                <span className="font-semibold text-slate-100">Tên đăng nhập:</span> {pendingDeleteAccount.username}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-100">Email:</span> {pendingDeleteAccount.email}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-100">Vai trò:</span> {pendingDeleteAccount.role}
              </p>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Nhập lại tên đăng nhập để xác nhận
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(event) => setDeleteConfirmInput(event.target.value)}
                placeholder={pendingDeleteAccount.username}
                className="w-full rounded-md border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-rose-300/45"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deletingUserId !== null}
                className="rounded-lg border border-white/15 bg-slate-900/75 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount(pendingDeleteAccount)}
                disabled={!isDeleteNameMatched || deletingUserId !== null || pendingDeleteAccount.role === 'ADMIN'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/35 bg-rose-300/20 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingUserId !== null ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminAccountsPage;
