import { AlertTriangle, Check, ChevronRight, Loader, Search } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
    getAdminHelpRequestDetail,
    getAdminHelpRequests,
    solveAdminHelpRequest,
    type AdminHelpRequest,
    type AdminHelpRequestDetail
} from '../../../services/admin-dashboard.service';

function AdminHelpRequestsPage() {
  const [helpRequests, setHelpRequests] = useState<AdminHelpRequest[]>([]);
  const [requestDetailById, setRequestDetailById] = useState<Record<number, AdminHelpRequestDetail>>({});
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [detailLoadingRequestId, setDetailLoadingRequestId] = useState<number | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const loadHelpRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const filters: any = {};
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter === 'solved' ? 'solved' : 'unsolved';
      }
      if (searchKeyword.trim()) {
        filters.search = searchKeyword.trim();
      }

      const data = await getAdminHelpRequests(currentPage, limit, filters);
      setHelpRequests(data.requests || []);
      setTotalPages(data.totalPages || 1);
      setExpandedRequestId((current) =>
        current && data.requests?.some((req) => req.id === current) ? current : null
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách yêu cầu hỗ trợ');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, statusFilter, searchKeyword]);

  useEffect(() => {
    void loadHelpRequests();
  }, [loadHelpRequests]);

  const handleToggleExpand = useCallback(async (requestId: number) => {
    if (expandedRequestId === requestId) {
      setExpandedRequestId(null);
      return;
    }

    setExpandedRequestId(requestId);

    if (requestDetailById[requestId]) {
      return;
    }

    setDetailLoadingRequestId(requestId);
    try {
      const detail = await getAdminHelpRequestDetail(requestId);
      setRequestDetailById((prev) => ({
        ...prev,
        [requestId]: detail,
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết yêu cầu');
    } finally {
      setDetailLoadingRequestId(null);
    }
  }, [expandedRequestId, requestDetailById]);

  const handleToggleSolved = useCallback(
    async (requestId: number, currentStatus: boolean) => {
      setUpdatingRequestId(requestId);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        await solveAdminHelpRequest(requestId, !currentStatus);
        setSuccessMessage(`Yêu cầu đánh dấu là ${!currentStatus ? 'đã giải quyết' : 'chưa giải quyết'}`);
        await loadHelpRequests();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái');
      } finally {
        setUpdatingRequestId(null);
      }
    },
    [loadHelpRequests]
  );

  const filteredRequests = useMemo(() => {
    return helpRequests;
  }, [helpRequests]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-white/10 bg-slate-900/35 p-4">
        <h2 className="text-xl font-bold text-slate-100">Yêu cầu hỗ trợ từ người dùng</h2>
        <p className="mt-1 text-sm text-slate-400">Quản lý và giải quyết các yêu cầu hỗ trợ từ người dùng</p>
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle size={16} />
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300 flex items-center gap-2">
          <Check size={16} />
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-white/10 bg-slate-900/20 p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm email, tên người dùng..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-white/10 bg-slate-800/50 py-2 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
          >
            <option value="ALL">Tất cả yêu cầu</option>
            <option value="unsolved">Chưa giải quyết</option>
            <option value="solved">Đã giải quyết</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-cyan-400" size={24} />
        </div>
      )}

      {/* Help Requests List */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="space-y-2">
          {filteredRequests.map((request) => {
            const isExpanded = expandedRequestId === request.id;
            const detail = requestDetailById[request.id];
            const isLoadingDetail = detailLoadingRequestId === request.id;
            const isUpdating = updatingRequestId === request.id;

            return (
              <Fragment key={request.id}>
                <div
                  className={`rounded-lg border transition ${
                    isExpanded ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-slate-900/35 hover:bg-slate-800/50'
                  }`}
                >
                  <button
                    onClick={() => void handleToggleExpand(request.id)}
                    className="w-full px-4 py-3 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ChevronRight
                          size={18}
                          className={`flex-shrink-0 transition ${isExpanded ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-100 truncate">{request.title}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {request.username} ({request.userEmail})
                          </p>
                                                  <p className="text-xs text-slate-500 truncate">
                                                    Đội: {request.teamName} | {request.schoolName}
                                                  </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            request.isSolve
                              ? 'bg-emerald-300/20 text-emerald-100'
                              : 'bg-amber-300/20 text-amber-100'
                          }`}
                        >
                          {request.isSolve ? 'Đã giải' : 'Chưa giải'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4">
                      {isLoadingDetail ? (
                        <div className="flex justify-center py-4">
                          <Loader className="animate-spin text-cyan-400" size={20} />
                        </div>
                      ) : detail ? (
                        <div className="space-y-4">
                          {/* Content */}
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Nội dung yêu cầu</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{detail.content}</p>
                          </div>

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-slate-400">Tạo lúc</p>
                              <p className="mt-1 text-slate-300">
                                {new Date(detail.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-400">Cập nhật lúc</p>
                              <p className="mt-1 text-slate-300">
                                {new Date(detail.updatedAt).toLocaleString('vi-VN')}
                                                          <div>
                                                            <p className="font-semibold text-slate-400">Tài khoản</p>
                                                            <p className="mt-1 text-slate-300">{detail.username}</p>
                                                            <p className="mt-0.5 text-slate-400">{detail.fullName}</p>
                                                            <p className="mt-0.5 text-slate-400">{detail.userEmail}</p>
                                                          </div>
                                                          <div>
                                                            <p className="font-semibold text-slate-400">Đội thi</p>
                                                            <p className="mt-1 text-slate-300">{detail.teamName}</p>
                                                            <p className="mt-0.5 text-slate-400">{detail.schoolName}</p>
                                                          </div>
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => void handleToggleSolved(request.id, request.isSolve)}
                              disabled={isUpdating}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                request.isSolve
                                  ? 'border border-amber-300/50 bg-amber-300/15 text-amber-100 hover:bg-amber-300/25 disabled:opacity-60'
                                  : 'border border-emerald-300/50 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/25 disabled:opacity-60'
                              }`}
                            >
                              {isUpdating ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                              {request.isSolve ? 'Đánh dấu chưa giải' : 'Đánh dấu đã giải'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRequests.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-slate-900/35 p-8 text-center">
          <p className="text-slate-400">Không có yêu cầu hỗ trợ nào</p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/35 p-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800/50 disabled:opacity-50"
          >
            Trang trước
          </button>
          <span className="text-sm text-slate-400">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800/50 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminHelpRequestsPage;
