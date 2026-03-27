import { AlertTriangle, Check, ChevronDown, ChevronRight, EllipsisVertical, ExternalLink, LoaderCircle, Search, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
    deleteAdminTeam,
    getAdminAccountDetail,
    getAdminDashboardData,
    getAdminTeamDetail,
    updateAdminTeamStatus,
    type AdminDashboardTeam,
    type AdminTeamDetail,
    type AdminTeamStatus,
} from '../../../services/admin-dashboard.service';
import { exportRowsToExcel } from '../../../utils/excel';

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

function AdminTeamsPage() {
  const [teams, setTeams] = useState<AdminDashboardTeam[]>([]);
  const [teamDetailById, setTeamDetailById] = useState<Record<number, AdminTeamDetail>>({});
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [menuTeamId, setMenuTeamId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortFilter, setSortFilter] = useState<string>('NAME_ASC');
  const [detailLoadingTeamId, setDetailLoadingTeamId] = useState<number | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const [pendingDeleteTeam, setPendingDeleteTeam] = useState<AdminDashboardTeam | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [updatingStatusTeamId, setUpdatingStatusTeamId] = useState<number | null>(null);
  const [reviewingPaymentTeamId, setReviewingPaymentTeamId] = useState<number | null>(null);
  const [rejectReasonByTeamId, setRejectReasonByTeamId] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [proofViewer, setProofViewer] = useState<{ src: string; teamName: string } | null>(null);
  const [proofZoom, setProofZoom] = useState<number>(1);

  const isDeleteNameMatched = pendingDeleteTeam
    ? deleteConfirmInput.trim() === pendingDeleteTeam.name
    : false;

  const statusActionItems: Array<{ value: AdminTeamStatus; className: string; dotClassName: string }> = [
    {
      value: 'Khởi tạo',
      className: 'text-rose-100 hover:border-rose-300/35 hover:bg-rose-300/15',
      dotClassName: 'bg-rose-300',
    },
    {
      value: 'Chờ duyệt',
      className: 'text-amber-100 hover:border-amber-300/35 hover:bg-amber-300/15',
      dotClassName: 'bg-amber-300',
    },
    {
      value: 'Đã duyệt',
      className: 'text-emerald-100 hover:border-emerald-300/35 hover:bg-emerald-300/15',
      dotClassName: 'bg-emerald-300',
    },
  ];

  const filteredTeams = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    const result = teams.filter((team) => {
      const statusMatched = statusFilter === 'ALL' || team.status === statusFilter;

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
      if (sortFilter === 'NAME_DESC') {
        return right.name.localeCompare(left.name, 'vi');
      }

      if (sortFilter === 'STATUS_ASC') {
        return formatTeamStatus(left.status).localeCompare(formatTeamStatus(right.status), 'vi');
      }

      if (sortFilter === 'STATUS_DESC') {
        return formatTeamStatus(right.status).localeCompare(formatTeamStatus(left.status), 'vi');
      }

      return left.name.localeCompare(right.name, 'vi');
    });
  }, [searchKeyword, sortFilter, statusFilter, teams]);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const data = await getAdminDashboardData();
      setTeams(data.allTeams);
      setExpandedTeamId((current) => (current && data.allTeams.some((team) => team.id === current) ? current : null));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách đội thi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleToggleExpand = useCallback(async (teamId: number) => {
    setMenuTeamId(null);

    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
      return;
    }

    setExpandedTeamId(teamId);

    if (teamDetailById[teamId]) {
      return;
    }

    setDetailLoadingTeamId(teamId);
    try {
      const detail = await getAdminTeamDetail(teamId);

      // Fallback for environments where team detail API hasn't exposed paidImage yet.
      if ((!detail.paidImage || detail.paidImage.trim() === '') && detail.userId) {
        try {
          const accountDetail = await getAdminAccountDetail(detail.userId);
          detail.paidImage = accountDetail.paidImage;
          detail.isPaid = accountDetail.isPaid;
        } catch {
          // Keep original detail when fallback lookup fails.
        }
      }

      setTeamDetailById((prev) => ({
        ...prev,
        [teamId]: detail,
      }));
      setRejectReasonByTeamId((prev) => ({
        ...prev,
        [teamId]: detail.rejectionReason ?? '',
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết đội thi');
    } finally {
      setDetailLoadingTeamId(null);
    }
  }, [expandedTeamId, teamDetailById]);

  const handleDeleteTeam = useCallback(async (team: AdminDashboardTeam) => {
    setDeletingTeamId(team.id);
    setMenuTeamId(null);

    try {
      await deleteAdminTeam(team.id);

      setTeams((prev) => prev.filter((item) => item.id !== team.id));
      setTeamDetailById((prev) => {
        const next = { ...prev };
        delete next[team.id];
        return next;
      });

      if (expandedTeamId === team.id) {
        setExpandedTeamId(null);
      }

      setPendingDeleteTeam(null);
      setDeleteConfirmInput('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Xóa đội thất bại');
    } finally {
      setDeletingTeamId(null);
    }
  }, [expandedTeamId]);

  const handleRequestDeleteTeam = useCallback((team: AdminDashboardTeam) => {
    setMenuTeamId(null);
    setPendingDeleteTeam(team);
    setDeleteConfirmInput('');
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    if (deletingTeamId !== null) {
      return;
    }

    setPendingDeleteTeam(null);
    setDeleteConfirmInput('');
  }, [deletingTeamId]);

  const handleUpdateStatus = useCallback(async (team: AdminDashboardTeam, status: AdminTeamStatus) => {
    if (team.status === status) {
      setMenuTeamId(null);
      return;
    }

    setUpdatingStatusTeamId(team.id);
    setMenuTeamId(null);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const result = await updateAdminTeamStatus(team.id, status);

      setTeams((prev) => prev.map((item) => (
        item.id === team.id ? { ...item, status } : item
      )));

      if (status === 'Đã duyệt') {
        if (result.approvalEmailSent === true) {
          const ownerText = result.ownerEmail
            ? `Email tài khoản đội (${result.ownerEmail}): ${result.ownerEmailSent ? 'đã gửi' : 'chưa gửi'}.`
            : 'Không tìm thấy email tài khoản đội.';
          setInfoMessage(`Duyệt đội thành công. ${ownerText}`);
        } else if (result.approvalEmailSent === false) {
          setErrorMessage(
            `Duyệt đội thành công nhưng gửi email thất bại. ${result.ownerEmail ? `Email tài khoản đội: ${result.ownerEmail}. ` : ''}${result.approvalEmailError || 'Không rõ lý do'}`
          );
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Cập nhật trạng thái thất bại');
    } finally {
      setUpdatingStatusTeamId(null);
    }
  }, []);

  const handleReviewPaymentProof = useCallback(async (team: AdminDashboardTeam, isAccepted: boolean) => {
    const targetStatus: AdminTeamStatus = isAccepted ? 'Đã duyệt' : 'Chờ duyệt';
    const rejectionReason = (rejectReasonByTeamId[team.id] ?? '').trim();

    if (!isAccepted && rejectionReason.length === 0) {
      setErrorMessage('Vui lòng nhập lý do từ chối trước khi cập nhật.');
      return;
    }

    setReviewingPaymentTeamId(team.id);
    setErrorMessage('');
    setInfoMessage('');
    try {
      const result = await updateAdminTeamStatus(team.id, targetStatus, isAccepted ? undefined : rejectionReason);

      setTeams((prev) => prev.map((item) => (
        item.id === team.id ? { ...item, status: targetStatus } : item
      )));

      setTeamDetailById((prev) => {
        const current = prev[team.id];
        if (!current) return prev;

        return {
          ...prev,
          [team.id]: {
            ...current,
            isPaid: isAccepted,
            status: targetStatus,
            rejectionReason: isAccepted ? null : rejectionReason,
          },
        };
      });

      if (isAccepted) {
        if (result.approvalEmailSent === true) {
          const ownerText = result.ownerEmail
            ? `Email tài khoản đội (${result.ownerEmail}): ${result.ownerEmailSent ? 'đã gửi' : 'chưa gửi'}.`
            : 'Không tìm thấy email tài khoản đội.';
          setInfoMessage(`Đã duyệt. ${ownerText}`);
        } else if (result.approvalEmailSent === false) {
          setErrorMessage(
            `Đã duyệt nhưng gửi email thất bại. ${result.ownerEmail ? `Email tài khoản đội: ${result.ownerEmail}. ` : ''}${result.approvalEmailError || 'Không rõ lý do'}`
          );
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái thanh toán');
    } finally {
      setReviewingPaymentTeamId(null);
    }
  }, [rejectReasonByTeamId]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const handleExportTeams = useCallback(() => {
    const rows = filteredTeams.map((team, index) => ({
      STT: index + 1,
      TenDoi: team.name,
      NguoiDaiDien: team.coach,
      DonVi: team.school,
      TrangThai: formatTeamStatus(team.status),
    }));

    exportRowsToExcel(rows, 'ucpc-thong-tin-cac-doi.xlsx', 'Thong tin cac doi');
  }, [filteredTeams]);

  const handleOpenProofViewer = useCallback((src: string, teamName: string) => {
    setProofViewer({ src, teamName });
    setProofZoom(1);
  }, []);

  const handleCloseProofViewer = useCallback(() => {
    setProofViewer(null);
    setProofZoom(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setProofZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setProofZoom((current) => Math.max(0.5, Number((current - 0.25).toFixed(2))));
  }, []);

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Thông tin các đội</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300">
            Hiển thị: {filteredTeams.length.toLocaleString('vi-VN')}/{teams.length.toLocaleString('vi-VN')} đội
          </span>
          <button
            type="button"
            onClick={handleExportTeams}
            disabled={filteredTeams.length === 0}
            className="rounded-lg border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Data
          </button>
          <button
            type="button"
            onClick={() => void loadTeams()}
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
          <p className="font-semibold">Không thể tải danh sách đội</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      {infoMessage ? (
        <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">Thông báo</p>
          <p className="mt-1">{infoMessage}</p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_220px_220px]">
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="Tìm theo tên đội, người đại diện, đơn vị..."
          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="Khởi tạo">Khởi tạo</option>
          <option value="Chờ duyệt">Chờ duyệt</option>
          <option value="Đã duyệt">Đã duyệt</option>
        </select>
        <select
          value={sortFilter}
          onChange={(event) => setSortFilter(event.target.value)}
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
              <th className="border border-white/10 px-3 py-2">Người đại diện</th>
              <th className="border border-white/10 px-3 py-2">Đơn vị</th>
              <th className="border border-white/10 px-3 py-2">Trạng thái</th>
                <th className="border border-white/10 px-3 py-2 text-right">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => {
                const detail = teamDetailById[team.id];
                const isExpanded = expandedTeamId === team.id;
                const isDetailLoading = detailLoadingTeamId === team.id;

                return (
                  <Fragment key={team.id}>
                    <tr
                      onClick={() => void handleToggleExpand(team.id)}
                      className="border border-white/10 cursor-pointer bg-slate-900/45 text-slate-100 hover:bg-slate-800/55"
                    >
                      <td className="border border-white/10 px-3 py-2 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          {team.name}
                        </span>
                      </td>
                      <td className="border border-white/10 px-3 py-2">{team.coach}</td>
                      <td className="border border-white/10 px-3 py-2 whitespace-pre-line">{team.school}</td>
                      <td className="border border-white/10 px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(team.status)}`}>
                          {formatTeamStatus(team.status)}
                        </span>
                      </td>
                      <td className="border border-white/10 px-3 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setMenuTeamId((current) => (current === team.id ? null : team.id))}
                            className={`rounded-md border p-1.5 transition ${
                              menuTeamId === team.id
                                ? 'border-cyan-300/45 bg-cyan-300/20 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                                : 'border-white/15 bg-slate-900/70 text-slate-200 hover:bg-slate-700'
                            }`}
                          >
                            <EllipsisVertical size={16} />
                          </button>

                          {menuTeamId === team.id ? (
                            <div className="admin-action-menu absolute right-0 z-20 mt-2 w-64 rounded-xl border border-cyan-200/25 bg-slate-950/95 p-2 shadow-[0_24px_70px_-18px_rgba(8,145,178,0.55)] backdrop-blur">
                              <div className="rounded-lg border border-white/10 bg-cyan-300/5 px-2 pb-2 pt-1.5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                                  Cập nhật trạng thái
                                </p>
                                <p className="mt-1 truncate text-xs font-medium text-slate-200" title={team.name}>
                                  Đội: {team.name}
                                </p>
                              </div>
                              <div className="mt-2 space-y-1">
                                {statusActionItems.map((item) => {
                                  const isSelected = team.status === item.value;
                                  const isUpdatingThisRow = updatingStatusTeamId === team.id;

                                  return (
                                    <button
                                      key={item.value}
                                      type="button"
                                      onClick={() => void handleUpdateStatus(team, item.value)}
                                      disabled={isUpdatingThisRow}
                                      className={`flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left text-sm transition disabled:opacity-60 ${item.className} ${
                                        isSelected
                                          ? 'border-cyan-300/40 bg-cyan-300/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]'
                                          : ''
                                      }`}
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${item.dotClassName}`} />
                                        <span>{item.value}</span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                                        {isSelected ? (
                                          isUpdatingThisRow ? (
                                            <LoaderCircle size={13} className="animate-spin text-cyan-200" />
                                          ) : (
                                            <>
                                              <Check size={13} className="text-cyan-200" />
                                              <span className="text-cyan-200">Đang chọn</span>
                                            </>
                                          )
                                        ) : null}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="my-2 h-px bg-white/10" />
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteTeam(team)}
                                disabled={deletingTeamId === team.id || updatingStatusTeamId === team.id}
                                className="flex w-full items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-sm text-rose-200 transition hover:border-rose-300/35 hover:bg-rose-300/15 disabled:opacity-60"
                              >
                                <Trash2 size={14} />
                                {deletingTeamId === team.id
                                  ? 'Đang xóa...'
                                  : updatingStatusTeamId === team.id
                                    ? 'Đang cập nhật...'
                                    : 'Xóa đội'}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr className="bg-slate-950/50 text-slate-200">
                        <td colSpan={5} className="px-4 py-3">
                          {isDetailLoading ? (
                            <div className="inline-flex items-center gap-2 text-sm text-slate-300">
                              <LoaderCircle size={15} className="animate-spin" />
                              Đang tải chi tiết đội...
                            </div>
                          ) : (
                            <div className="space-y-3 rounded-lg border border-white/10 bg-slate-900/45 p-3">
                              <div className="grid gap-2 text-sm md:grid-cols-2">
                                <p>
                                  <span className="font-semibold text-slate-100">Người đại diện:</span> {detail?.coach ?? team.coach}
                                </p>
                                <p className="whitespace-pre-line">
                                  <span className="font-semibold text-slate-100">Đơn vị:</span> {detail?.school ?? team.school}
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-100">Thanh toán:</span>{' '}
                                  {detail?.isPaid ? 'Đã xác nhận' : 'Chưa xác nhận'}
                                </p>
                              </div>

                              <div className="rounded-lg border border-cyan-200/20 bg-slate-950/50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-100">Minh chứng thanh toán</p>
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${detail?.paidImage ? 'bg-emerald-300/20 text-emerald-100' : 'bg-amber-300/20 text-amber-100'}`}>
                                    {detail?.paidImage ? 'Đã có minh chứng' : 'Chưa có minh chứng'}
                                  </span>
                                </div>
                                {detail?.paidImage ? (
                                  <div className="mt-3 grid gap-3 md:grid-cols-[260px_1fr]">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenProofViewer(detail.paidImage as string, team.name)}
                                      className="group relative flex h-[260px] items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-slate-900/70"
                                    >
                                      <img
                                        src={detail.paidImage}
                                        alt={`Minh chứng thanh toán của đội ${team.name}`}
                                        className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.02]"
                                      />
                                      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-left text-[11px] text-slate-100 opacity-0 transition group-hover:opacity-100">
                                        Bấm để phóng to
                                      </span>
                                    </button>

                                    <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-slate-900/45 p-3">
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Hành động</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenProofViewer(detail.paidImage as string, team.name)}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-violet-300/35 bg-violet-300/15 px-3 py-1.5 text-xs font-medium text-violet-100 transition hover:bg-violet-300/25"
                                          >
                                            <Search size={13} />
                                            Xem chi tiết
                                          </button>
                                          <a
                                            href={detail.paidImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/35 bg-cyan-300/15 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/25"
                                          >
                                            <ExternalLink size={13} />
                                            Mở tab mới
                                          </a>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => void handleReviewPaymentProof(team, true)}
                                            disabled={reviewingPaymentTeamId === team.id}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/35 bg-emerald-300/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {reviewingPaymentTeamId === team.id ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
                                            Chấp nhận
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => void handleReviewPaymentProof(team, false)}
                                            disabled={reviewingPaymentTeamId === team.id}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-rose-300/35 bg-rose-300/15 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {reviewingPaymentTeamId === team.id ? <LoaderCircle size={13} className="animate-spin" /> : <X size={13} />}
                                            Từ chối
                                          </button>
                                        </div>

                                        <div className="mt-3">
                                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                            Lý do từ chối
                                          </label>
                                          <textarea
                                            value={rejectReasonByTeamId[team.id] ?? ''}
                                            onChange={(event) => setRejectReasonByTeamId((prev) => ({
                                              ...prev,
                                              [team.id]: event.target.value,
                                            }))}
                                            rows={3}
                                            placeholder="Ví dụ: Ảnh mờ, thiếu nội dung chuyển khoản, sai số tiền..."
                                            className="w-full rounded-md border border-white/15 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none transition focus:border-rose-300/45"
                                          />
                                        </div>
                                      </div>
                                      <p className="mt-3 text-xs text-slate-400">
                                        Nếu ảnh mờ, dùng Xem chi tiết để phóng to hoặc mở tab mới để kiểm tra rõ nội dung.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-slate-300">Đội chưa tải ảnh minh chứng.</p>
                                )}

                                {detail?.rejectionReason ? (
                                  <div className="mt-3 rounded-md border border-rose-300/25 bg-rose-300/10 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-200">Lý do từ chối gần nhất</p>
                                    <p className="mt-1 text-xs text-rose-100">{detail.rejectionReason}</p>
                                  </div>
                                ) : null}
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
                                  <p className="text-xs text-slate-300">Đội chưa có dữ liệu thành viên.</p>
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
                  {isLoading ? 'Đang tải danh sách đội...' : 'Chưa có dữ liệu đội thi.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingDeleteTeam ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-300/25 bg-slate-950/95 p-5 shadow-[0_32px_90px_-24px_rgba(244,63,94,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex rounded-lg border border-rose-300/35 bg-rose-300/15 p-2 text-rose-200">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Xóa đội vĩnh viễn</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Thao tác này sẽ xóa toàn bộ thành viên, hồ sơ tiến trình và yêu cầu hỗ trợ của đội.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
              Đội: <span className="font-semibold text-white">{pendingDeleteTeam.name}</span>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Nhập chính xác tên đội để xác nhận
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(event) => setDeleteConfirmInput(event.target.value)}
                placeholder={pendingDeleteTeam.name}
                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-rose-300/50"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deletingTeamId === pendingDeleteTeam.id}
                className="rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteTeam(pendingDeleteTeam)}
                disabled={!isDeleteNameMatched || deletingTeamId === pendingDeleteTeam.id}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300/40 bg-rose-300/20 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-300/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingTeamId === pendingDeleteTeam.id ? <LoaderCircle size={14} className="animate-spin" /> : null}
                {deletingTeamId === pendingDeleteTeam.id ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {proofViewer ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={handleCloseProofViewer}
        >
          <div
            className="w-full max-w-6xl rounded-2xl border border-cyan-200/25 bg-slate-950/95 shadow-[0_40px_90px_-24px_rgba(34,211,238,0.4)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Minh chứng thanh toán - {proofViewer.teamName}</p>
                <p className="text-xs text-slate-400">Tỉ lệ phóng: {Math.round(proofZoom * 100)}%</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-100 transition hover:bg-slate-800"
                >
                  <ZoomOut size={13} />
                  Thu nhỏ
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-100 transition hover:bg-slate-800"
                >
                  <ZoomIn size={13} />
                  Phóng to
                </button>
                <button
                  type="button"
                  onClick={() => setProofZoom(1)}
                  className="rounded-md border border-white/15 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-100 transition hover:bg-slate-800"
                >
                  Reset
                </button>
                <a
                  href={proofViewer.src}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-cyan-300/35 bg-cyan-300/15 px-2.5 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-300/25"
                >
                  <ExternalLink size={13} />
                  Tab mới
                </a>
                <button
                  type="button"
                  onClick={handleCloseProofViewer}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-300/35 bg-rose-300/15 px-2.5 py-1.5 text-xs text-rose-100 transition hover:bg-rose-300/25"
                >
                  <X size={13} />
                  Đóng
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto p-4">
              <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <img
                  src={proofViewer.src}
                  alt={`Minh chứng thanh toán của đội ${proofViewer.teamName}`}
                  className="max-w-full rounded-lg object-contain transition-transform duration-200"
                  style={{ transform: `scale(${proofZoom})` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminTeamsPage;
