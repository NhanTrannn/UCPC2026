import { ChevronDown, ChevronRight, LoaderCircle } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
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

  if (detail.isUpdate === true && detail.isPaid === true) {
    return 'Đã duyệt';
  }

  if (detail.isUpdate === true) {
    return 'Chờ duyệt';
  }

  return 'Khởi tạo';
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

function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [detailByUserId, setDetailByUserId] = useState<Record<number, AdminAccountDetail>>({});
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortFilter, setSortFilter] = useState<string>('USERNAME_ASC');
  const [detailLoadingUserId, setDetailLoadingUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

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
      setAccounts(data);
      setExpandedUserId((current) => (current && data.some((item) => item.id === current) ? current : null));
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
                    </tr>

                    {isExpanded ? (
                      <tr className="bg-slate-950/50 text-slate-200">
                        <td colSpan={4} className="px-4 py-3">
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
                                  <span className="font-semibold text-slate-100">HLV:</span> {detail?.trainerName || 'Chưa cập nhật'}
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
                <td colSpan={4} className="border border-white/10 px-3 py-4 text-center text-slate-300">
                  {isLoading ? 'Đang tải danh sách tài khoản...' : 'Chưa có dữ liệu tài khoản.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminAccountsPage;
