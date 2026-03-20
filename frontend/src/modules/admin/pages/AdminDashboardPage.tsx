import { ArrowDownRight, ArrowUpRight, Clock3, FileCheck2, LoaderCircle, School, Users2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAdminDashboardData,
  type AdminDashboardData,
  type AdminDashboardTeam,
  type AdminDashboardUnpaidAccount,
} from '../../../services/admin-dashboard.service';
import { exportRowsToExcel } from '../../../utils/excel';

const DEFAULT_DASHBOARD_DATA: AdminDashboardData = {
  totalUser: 0,
  totalRegisteredTeams: 0,
  totalUpdatedInfo: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  totalUnsolvedRequest: 0,
  totalUnupdatedInfo: 0,
  totalSchools: 0,
  totalHighSchool: 0,
  totalUniversity: 0,
  participatingSchools: [],
  unpaidAccounts: [],
  recentTeams: [],
  allTeams: [],
};

function getStatusBadgeClass(status: string): string {
  if (status === 'Đã duyệt') {
    return 'bg-emerald-300/20 text-emerald-100';
  }

  if (status === 'Chờ duyệt') {
    return 'bg-amber-300/20 text-amber-100';
  }

  return 'bg-rose-300/20 text-rose-100';
}

function formatTeamStatus(status: string): string {
  if (status === 'Khởi tạo') {
    return 'Chưa hoàn tất';
  }

  return status;
}

type DashboardCardKey = 'totalTeams' | 'unpaid' | 'schools' | 'validProfiles';

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData>(DEFAULT_DASHBOARD_DATA);
  const [activeStatModal, setActiveStatModal] = useState<DashboardCardKey | null>(null);
  const [recentTeamsSearchKeyword, setRecentTeamsSearchKeyword] = useState<string>('');
  const [recentTeamsStatusFilter, setRecentTeamsStatusFilter] = useState<string>('ALL');
  const [recentTeamsSortFilter, setRecentTeamsSortFilter] = useState<string>('NAME_ASC');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getAdminDashboardData();
      setDashboard(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const participatingSchools = useMemo(() => {
    if (dashboard.participatingSchools.length > 0) {
      return dashboard.participatingSchools;
    }

    const placeholderSchools = new Set(['Khối THPT', 'Khối Đại học', 'Chưa cập nhật']);
    const schoolsMap = new Map<string, number>();

    for (const team of dashboard.allTeams) {
      const schoolName = team.school?.trim() ?? '';

      if (!schoolName || placeholderSchools.has(schoolName)) {
        continue;
      }

      schoolsMap.set(schoolName, (schoolsMap.get(schoolName) ?? 0) + 1);
    }

    return Array.from(schoolsMap.entries())
      .map(([name, teams]) => ({ name, teams }))
      .sort((left, right) => {
        if (right.teams !== left.teams) {
          return right.teams - left.teams;
        }

        return left.name.localeCompare(right.name, 'vi');
      });
  }, [dashboard.allTeams, dashboard.participatingSchools]);

  const displayedSchoolCount = participatingSchools.length;

  const statCards: Array<{
    key: DashboardCardKey;
    label: string;
    value: number;
    trend: string;
    positive: boolean;
    icon: typeof Users2;
  }> = useMemo(
    () => [
      {
        key: 'totalTeams',
        label: 'Tổng đội đăng ký',
        value: dashboard.totalRegisteredTeams,
        trend: `${dashboard.totalUser} tài khoản USER`,
        positive: true,
        icon: Users2,
      },
      {
        key: 'unpaid',
        label: 'Tài khoản chưa hoàn tất',
        value: dashboard.totalUnpaid,
        trend: `${dashboard.totalUnpaid} tài khoản chưa hoàn tất`,
        positive: false,
        icon: Clock3,
      },
      {
        key: 'schools',
        label: 'Trường tham gia',
        value: displayedSchoolCount,
        trend: `THPT ${dashboard.totalHighSchool} | ĐH ${dashboard.totalUniversity}`,
        positive: true,
        icon: School,
      },
      {
        key: 'validProfiles',
        label: 'Hồ sơ hợp lệ',
        value: dashboard.totalPaid,
        trend: `${dashboard.totalUpdatedInfo} hồ sơ đã cập nhật`,
        positive: true,
        icon: FileCheck2,
      },
    ],
    [dashboard, displayedSchoolCount]
  );

  const allTeamsSorted = useMemo(
    () => [...dashboard.allTeams].sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    [dashboard.allTeams]
  );

  const unpaidAccountsSorted = useMemo(
    () =>
      [...dashboard.unpaidAccounts].sort((left, right) =>
        left.username.localeCompare(right.username, 'vi')
      ),
    [dashboard.unpaidAccounts]
  );

  const validTeams = useMemo(
    () => allTeamsSorted.filter((team) => team.status === 'Đã duyệt'),
    [allTeamsSorted]
  );

  const registrationFunnel = useMemo(
    () => [
      { stage: 'Khởi tạo', count: dashboard.totalUser, color: 'bg-cyan-300/85' },
      { stage: 'Đã gửi', count: dashboard.totalUpdatedInfo, color: 'bg-emerald-300/85' },
      { stage: 'Đã duyệt', count: dashboard.totalPaid, color: 'bg-lime-300/85' },
      { stage: 'Bổ sung hồ sơ', count: dashboard.totalUnupdatedInfo, color: 'bg-amber-300/85' },
    ],
    [dashboard]
  );

  const recentTeams: AdminDashboardTeam[] = dashboard.recentTeams;
  const filteredRecentTeams = useMemo(() => {
    const normalizedKeyword = recentTeamsSearchKeyword.trim().toLowerCase();

    const result = recentTeams.filter((team) => {
      const statusMatched = recentTeamsStatusFilter === 'ALL' || team.status === recentTeamsStatusFilter;

      if (!statusMatched) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return [team.name, team.coach, team.school].some((value) =>
        value.toLowerCase().includes(normalizedKeyword)
      );
    });

    return result.sort((left, right) => {
      if (recentTeamsSortFilter === 'NAME_DESC') {
        return right.name.localeCompare(left.name, 'vi');
      }

      if (recentTeamsSortFilter === 'STATUS_ASC') {
        return formatTeamStatus(left.status).localeCompare(formatTeamStatus(right.status), 'vi');
      }

      if (recentTeamsSortFilter === 'STATUS_DESC') {
        return formatTeamStatus(right.status).localeCompare(formatTeamStatus(left.status), 'vi');
      }

      return left.name.localeCompare(right.name, 'vi');
    });
  }, [recentTeams, recentTeamsSearchKeyword, recentTeamsSortFilter, recentTeamsStatusFilter]);

  const handleExportRecentTeams = useCallback(() => {
    const rows = filteredRecentTeams.map((team, index) => ({
      STT: index + 1,
      TenDoi: team.name,
      HuanLuyenVien: team.coach,
      DonVi: team.school,
      TrangThai: formatTeamStatus(team.status),
    }));

    exportRowsToExcel(rows, 'ucpc-dashboard-doi-cap-nhat-moi-nhat.xlsx', 'Doi cap nhat moi nhat');
  }, [filteredRecentTeams]);

  const handleExportSchools = useCallback(() => {
    const rows = participatingSchools.map((school, index) => ({
      STT: index + 1,
      Truong: school.name,
      SoDoi: school.teams,
    }));

    exportRowsToExcel(rows, 'ucpc-dashboard-truong-tham-gia.xlsx', 'Truong tham gia');
  }, [participatingSchools]);

  const handleExportRegisteredTeams = useCallback(() => {
    const rows = allTeamsSorted.map((team, index) => ({
      STT: index + 1,
      TenDoi: team.name,
      HuanLuyenVien: team.coach,
      DonVi: team.school,
      TrangThai: formatTeamStatus(team.status),
    }));

    exportRowsToExcel(rows, 'ucpc-dashboard-tong-doi-dang-ky.xlsx', 'Tong doi dang ky');
  }, [allTeamsSorted]);

  const handleExportUnpaidAccounts = useCallback(() => {
    const rows = unpaidAccountsSorted.map((account, index) => ({
      STT: index + 1,
      TaiKhoan: account.username,
      Email: account.email,
      DonVi: account.teamName,
      TrangThai: formatTeamStatus(account.status),
    }));

    exportRowsToExcel(rows, 'ucpc-dashboard-tai-khoan-chua-hoan-tat.xlsx', 'Tai khoan chua hoan tat');
  }, [unpaidAccountsSorted]);

  const handleExportValidProfiles = useCallback(() => {
    const rows = validTeams.map((team, index) => ({
      STT: index + 1,
      TenDoi: team.name,
      HuanLuyenVien: team.coach,
      DonVi: team.school,
      TrangThai: formatTeamStatus(team.status),
    }));

    exportRowsToExcel(rows, 'ucpc-dashboard-ho-so-hop-le.xlsx', 'Ho so hop le');
  }, [validTeams]);

  const handleExportActiveStatModal = useCallback(() => {
    if (activeStatModal === 'schools') {
      handleExportSchools();
      return;
    }

    if (activeStatModal === 'totalTeams') {
      handleExportRegisteredTeams();
      return;
    }

    if (activeStatModal === 'unpaid') {
      handleExportUnpaidAccounts();
      return;
    }

    if (activeStatModal === 'validProfiles') {
      handleExportValidProfiles();
    }
  }, [
    activeStatModal,
    handleExportSchools,
    handleExportRegisteredTeams,
    handleExportUnpaidAccounts,
    handleExportValidProfiles,
  ]);

  const isActiveModalExportDisabled = useMemo(() => {
    if (!activeStatModal) {
      return true;
    }

    if (activeStatModal === 'schools') {
      return participatingSchools.length === 0;
    }

    if (activeStatModal === 'totalTeams') {
      return allTeamsSorted.length === 0;
    }

    if (activeStatModal === 'unpaid') {
      return unpaidAccountsSorted.length === 0;
    }

    return validTeams.length === 0;
  }, [activeStatModal, participatingSchools, allTeamsSorted, unpaidAccountsSorted, validTeams]);

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <section className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">
          <p className="font-semibold">Không thể tải dashboard</p>
          <p className="mt-1">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-3 rounded-lg border border-rose-200/40 px-3 py-2 text-xs font-medium transition hover:bg-rose-300/15"
          >
            Thử lại
          </button>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.positive ? ArrowUpRight : ArrowDownRight;

          return (
            <article
              key={card.label}
              className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_20px_60px_-30px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/40 hover:bg-slate-900/60"
              onClick={() => setActiveStatModal(card.key)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                    {isLoading ? '...' : card.value.toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className="rounded-lg bg-cyan-300/15 p-2 text-cyan-100">
                  <Icon size={18} />
                </span>
              </div>
              <p
                className={`mt-3 inline-flex items-start gap-1 rounded-full px-2 py-1 text-xs ${
                  card.positive
                    ? 'bg-emerald-300/15 text-emerald-100'
                    : 'bg-amber-300/15 text-amber-100'
                }`}
              >
                <TrendIcon size={14} />
                <span>{card.trend}</span>
              </p>
            </article>
          );
        })}
      </section>

      {activeStatModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setActiveStatModal(null)}
        >
          <div
            className="w-full max-w-6xl rounded-2xl border border-cyan-200/20 bg-slate-950/95 p-6 shadow-[0_24px_90px_-24px_rgba(34,211,238,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {activeStatModal === 'schools' ? (
                  <>
                    <h3 className="text-lg font-semibold text-white">Danh sách trường tham gia</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Có {participatingSchools.length.toLocaleString('vi-VN')} trường có dữ liệu thành viên.
                    </p>
                  </>
                ) : null}
                {activeStatModal === 'totalTeams' ? (
                  <>
                    <h3 className="text-lg font-semibold text-white">Danh sách đội đăng ký</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Có {allTeamsSorted.length.toLocaleString('vi-VN')} đội trong hệ thống.
                    </p>
                  </>
                ) : null}
                {activeStatModal === 'unpaid' ? (
                  <>
                    <h3 className="text-lg font-semibold text-white">Tài khoản chưa hoàn tất</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Có {unpaidAccountsSorted.length.toLocaleString('vi-VN')} tài khoản USER chưa hoàn tất.
                    </p>
                  </>
                ) : null}
                {activeStatModal === 'validProfiles' ? (
                  <>
                    <h3 className="text-lg font-semibold text-white">Đội có hồ sơ hợp lệ</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Có {validTeams.length.toLocaleString('vi-VN')} đội đã được duyệt.
                    </p>
                  </>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportActiveStatModal}
                  disabled={isActiveModalExportDisabled}
                  className="rounded-lg border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export Data
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStatModal(null)}
                  className="rounded-lg border border-white/15 bg-slate-900/70 p-2 text-slate-200 transition hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-[68vh] overflow-y-auto rounded-xl border border-white/10">
              {activeStatModal === 'schools' ? (
                participatingSchools.length > 0 ? (
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-900/95">
                      <tr className="border-b border-white/10 text-left text-slate-300">
                        <th className="px-4 py-3">Trường</th>
                        <th className="px-4 py-3 text-right">Số đội</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participatingSchools.map((school, index) => (
                        <tr
                          key={school.name}
                          className="border-b border-white/10 text-slate-100 transition hover:bg-slate-800/60"
                        >
                          <td className="px-4 py-2.5">
                            <span className="mr-2 text-xs text-slate-400">#{index + 1}</span>
                            {school.name}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-cyan-100">{school.teams}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-300">
                    Chưa có danh sách trường cụ thể để hiển thị.
                  </div>
                )
              ) : null}

              {activeStatModal === 'totalTeams' ? (
                allTeamsSorted.length > 0 ? (
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-900/95">
                      <tr className="border-b border-white/10 text-left text-slate-300">
                        <th className="px-4 py-3">Đội thi</th>
                        <th className="px-4 py-3">Huấn luyện viên</th>
                        <th className="px-4 py-3">Đơn vị</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTeamsSorted.map((team, index) => (
                        <tr
                          key={`modal-team-${team.id}`}
                          className="border-b border-white/10 text-slate-100 transition hover:bg-slate-800/60"
                        >
                          <td className="px-4 py-2.5">
                            <span className="mr-2 text-xs text-slate-400">#{index + 1}</span>
                            {team.name}
                          </td>
                          <td className="px-4 py-2.5">{team.coach}</td>
                          <td className="px-4 py-2.5 whitespace-pre-line">{team.school}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(team.status)}`}>
                              {formatTeamStatus(team.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-300">Chưa có đội đăng ký để hiển thị.</div>
                )
              ) : null}

              {activeStatModal === 'unpaid' ? (
                unpaidAccountsSorted.length > 0 ? (
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-900/95">
                      <tr className="border-b border-white/10 text-left text-slate-300">
                        <th className="px-4 py-3">Tài khoản</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Đơn vị</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidAccountsSorted.map((account: AdminDashboardUnpaidAccount, index) => (
                        <tr
                          key={`modal-unpaid-${account.id}`}
                          className="border-b border-white/10 text-slate-100 transition hover:bg-slate-800/60"
                        >
                          <td className="px-4 py-2.5">
                            <span className="mr-2 text-xs text-slate-400">#{index + 1}</span>
                            {account.username}
                          </td>
                          <td className="px-4 py-2.5">{account.email}</td>
                          <td className="px-4 py-2.5 whitespace-pre-line">{account.teamName}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(account.status)}`}>
                              {formatTeamStatus(account.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-300">
                    Không có tài khoản USER nào đang ở trạng thái chưa hoàn tất.
                  </div>
                )
              ) : null}

              {activeStatModal === 'validProfiles' ? (
                validTeams.length > 0 ? (
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-900/95">
                      <tr className="border-b border-white/10 text-left text-slate-300">
                        <th className="px-4 py-3">Đội thi</th>
                        <th className="px-4 py-3">Huấn luyện viên</th>
                        <th className="px-4 py-3">Đơn vị</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validTeams.map((team, index) => (
                        <tr
                          key={`modal-valid-${team.id}`}
                          className="border-b border-white/10 text-slate-100 transition hover:bg-slate-800/60"
                        >
                          <td className="px-4 py-2.5">
                            <span className="mr-2 text-xs text-slate-400">#{index + 1}</span>
                            {team.name}
                          </td>
                          <td className="px-4 py-2.5">{team.coach}</td>
                          <td className="px-4 py-2.5 whitespace-pre-line">{team.school}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(team.status)}`}>
                              {formatTeamStatus(team.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-300">Chưa có đội nào ở trạng thái đã duyệt.</div>
                )
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tiến độ đăng ký</h2>
            <span className="text-xs text-slate-300">
              {isLoading ? 'Đang tải dữ liệu...' : 'Dữ liệu realtime từ hệ thống'}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {registrationFunnel.map((item) => {
              const maxBase = registrationFunnel[0].count || 1;
              const width = `${Math.round((item.count / maxBase) * 100)}%`;
              return (
                <div key={item.stage}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-200">{item.stage}</span>
                    <span className="font-medium text-slate-100">{item.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10">
                    <div className={`${item.color} h-2.5 rounded-full transition-all`} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
          <h2 className="text-lg font-semibold">Thông báo nhanh</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-200">
            <li className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-3">
              Có {dashboard.totalUpdatedInfo} đội đã hoàn tất cập nhật thông tin đăng ký.
            </li>
            <li className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3">
              Hiện có {dashboard.totalUnpaid} tài khoản chưa hoàn tất hồ sơ hoặc thanh toán.
            </li>
            <li className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3">
              Tỉ lệ hồ sơ hợp lệ: {dashboard.totalPaid}/{Math.max(dashboard.totalUpdatedInfo, 1)}.
            </li>
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Đội thi cập nhật mới nhất</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">
              Hiển thị: {filteredRecentTeams.length.toLocaleString('vi-VN')}/{recentTeams.length.toLocaleString('vi-VN')} đội
            </span>
            <button
              type="button"
              onClick={handleExportRecentTeams}
              disabled={filteredRecentTeams.length === 0}
              className="rounded-lg border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export Data
            </button>
            <button
              type="button"
              onClick={() => void loadDashboard()}
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

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_220px_220px]">
          <input
            type="text"
            value={recentTeamsSearchKeyword}
            onChange={(event) => setRecentTeamsSearchKeyword(event.target.value)}
            placeholder="Tìm theo tên đội, HLV, đơn vị..."
            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
          />
          <select
            value={recentTeamsStatusFilter}
            onChange={(event) => setRecentTeamsStatusFilter(event.target.value)}
            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Khởi tạo">Khởi tạo</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
          </select>
          <select
            value={recentTeamsSortFilter}
            onChange={(event) => setRecentTeamsSortFilter(event.target.value)}
            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
          >
            <option value="NAME_ASC">Tên đội A-Z</option>
            <option value="NAME_DESC">Tên đội Z-A</option>
            <option value="STATUS_ASC">Trạng thái A-Z</option>
            <option value="STATUS_DESC">Trạng thái Z-A</option>
          </select>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border border-white/10 text-left text-slate-300">
                <th className="border border-white/10 px-3 py-2">Tên đội</th>
                <th className="border border-white/10 px-3 py-2">Huấn luyện viên</th>
                <th className="border border-white/10 px-3 py-2">Đơn vị</th>
                <th className="border border-white/10 px-3 py-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentTeams.length > 0 ? (
                filteredRecentTeams.map((team) => (
                  <tr key={`recent-${team.id}`} className="border border-white/10 bg-slate-900/45 text-slate-100">
                    <td className="border border-white/10 px-3 py-2 font-semibold">{team.name}</td>
                    <td className="border border-white/10 px-3 py-2">{team.coach}</td>
                    <td className="border border-white/10 px-3 py-2 whitespace-pre-line">{team.school}</td>
                    <td className="border border-white/10 px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(team.status)}`}>
                        {formatTeamStatus(team.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border border-white/10">
                  <td colSpan={4} className="border border-white/10 px-3 py-4 text-center text-slate-300">
                    {isLoading ? 'Đang tải danh sách đội mới...' : 'Chưa có dữ liệu đội thi mới cập nhật.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default AdminDashboardPage;
