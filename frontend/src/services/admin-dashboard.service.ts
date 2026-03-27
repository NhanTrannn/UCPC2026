import { apiRequest } from './http';

interface ApiResult<TData> {
  EM: string;
  EC: number;
  DT: TData;
}

interface AllUsersRow {
  id: number | string;
  email?: string;
  username?: string;
  role?: string;
  teamName?: string;
}

interface AllUsersData {
  rows?: AllUsersRow[];
}

export interface AdminDashboardTeam {
  id: number;
  name: string;
  coach: string;
  school: string;
  status: 'Đã duyệt' | 'Chờ duyệt' | 'Khởi tạo' | string;
  createdAt?: string;
}

export interface AdminDashboardUnpaidAccount {
  id: number;
  username: string;
  email: string;
  teamName: string;
  status: 'Đã duyệt' | 'Chờ duyệt' | 'Khởi tạo' | string;
}

export interface AdminTeamMember {
  id: number;
  fullName?: string;
  citizenId?: string;
  phone?: string;
  birth?: string | null;
  schoolName?: string;
}

export interface AdminTeamDetail {
  id: number;
  userId?: number;
  teamName: string;
  coach: string;
  school: string;
  paidImage: string | null;
  isPaid: boolean | null;
  rejectionReason: string | null;
  status: string;
  participants: AdminTeamMember[];
  createdAt?: string;
  updatedAt?: string;
}

export type AdminTeamStatus = 'Khởi tạo' | 'Chờ duyệt' | 'Đã duyệt';

export interface AdminDashboardData {
  totalUser: number;
  totalRegisteredTeams: number;
  totalUpdatedInfo: number;
  totalPaid: number;
  totalUnpaid: number;
  totalUnsolvedRequest: number;
  totalUnupdatedInfo: number;
  totalSchools: number;
  totalHighSchool: number;
  totalUniversity: number;
  participatingSchools: Array<{
    name: string;
    teams: number;
  }>;
  unpaidAccounts: AdminDashboardUnpaidAccount[];
  recentTeams: AdminDashboardTeam[];
  allTeams: AdminDashboardTeam[];
}

export interface AdminAccountRow {
  id: number;
  email: string;
  username: string;
  role: string;
  teamName: string;
}

export type AdminRepresentativeRole = 'LEADER' | 'COACH';

export interface AdminAccountDetail {
  id: number;
  email: string;
  username: string;
  role: string;
  teamName: string;
  paidImage: string | null;
  isPaid: boolean | null;
  isUpdate: boolean | null;
  isHighSchool: boolean | null;
  trainerName: string | null;
  representativeName: string | null;
  representativeRole: AdminRepresentativeRole | null;
  participants: AdminTeamMember[];
}

interface AdminDashboardApiData {
  totalUser?: number;
  totalRegisteredTeams?: number;
  totalUpdatedInfo?: number;
  totalPaid?: number;
  totalUnpaid?: number;
  totalUnsolvedRequest?: number;
  totalUnupdatedInfo?: number;
  totalSchools?: number;
  totalHighSchool?: number;
  totalUniversity?: number;
  participatingSchools?: Array<{
    name?: string;
    teams?: number;
  }>;
  unpaidAccounts?: Array<{
    id?: number;
    username?: string;
    email?: string;
    teamName?: string;
    status?: string;
  }>;
  recentTeams?: AdminDashboardTeam[];
  allTeams?: AdminDashboardTeam[];
}

interface AdminTeamDetailApiData {
  id?: number;
  userId?: number;
  teamName?: string;
  coach?: string;
  school?: string;
  paidImage?: string | null;
  isPaid?: boolean | null;
  rejectionReason?: string | null;
  status?: string;
  participants?: AdminTeamMember[];
  createdAt?: string;
  updatedAt?: string;
}

interface UpdateTeamStatusApiData {
  teamId?: number;
  status?: string;
  isPaid?: boolean;
  isUpdate?: boolean;
  rejectionReason?: string | null;
  approvalEmailSent?: boolean | null;
  approvalEmailError?: string | null;
  approvalEmailRecipients?: string[];
  ownerEmail?: string | null;
  ownerEmailSent?: boolean | null;
}

interface AdminUserDetailApiData {
  id?: number;
  email?: string;
  username?: string;
  role?: string;
  teamName?: string;
  paidImage?: string | null;
  isPaid?: boolean;
  isUpdate?: boolean;
  isHighSchool?: boolean | null;
  trainerName?: string | null;
  representatives?: Partial<Record<AdminRepresentativeRole, {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    schoolName?: string | null;
  }>>;
  Participants?: AdminTeamMember[];
}

function normalizeAccountTeamName(teamName: string | undefined, role: string | undefined): string {
  const normalizedRole = (role ?? '').toUpperCase();
  const rawTeamName = (teamName ?? '').trim();
  const loweredTeamName = rawTeamName.toLowerCase();

  if (normalizedRole !== 'USER') {
    return 'ADMIN/STAFF';
  }

  if (!rawTeamName || loweredTeamName.includes('not updated yet')) {
    return 'Chưa cập nhật';
  }

  return rawTeamName;
}

function toFallbackTeams(rows: AllUsersRow[] | undefined): AdminDashboardTeam[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => row.role === 'USER')
    .filter((row) => row.teamName && row.teamName !== 'Not updated yet / admin account')
    .map((row) => ({
      id: Number(row.id),
      name: row.teamName as string,
      coach: 'Chưa cập nhật',
      school: 'Chưa cập nhật',
      status: 'Khởi tạo',
    }));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const response = await apiRequest<ApiResult<AdminDashboardApiData>>('/api/v1/getDashboard');

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể tải dữ liệu dashboard');
  }

  const data = response.DT ?? {};
  let allTeams = Array.isArray(data.allTeams) ? data.allTeams : [];
  let recentTeams = Array.isArray(data.recentTeams) ? data.recentTeams : [];

  if (allTeams.length === 0 && recentTeams.length > 0) {
    allTeams = recentTeams;
  }

  if (recentTeams.length === 0 && allTeams.length > 0) {
    recentTeams = allTeams.slice(0, 5);
  }

  // Backward compatibility: older backend versions don't include team list in getDashboard.
  if (allTeams.length === 0) {
    try {
      const usersResponse = await apiRequest<ApiResult<AllUsersData>>('/api/v1/getAllUsers');
      if (usersResponse.EC === 0) {
        allTeams = toFallbackTeams(usersResponse.DT?.rows);
        recentTeams = allTeams.slice(0, 5);
      }
    } catch {
      // Keep empty list when fallback request fails.
    }
  }

  return {
    totalUser: data.totalUser ?? 0,
    totalRegisteredTeams: data.totalRegisteredTeams ?? data.totalUpdatedInfo ?? 0,
    totalUpdatedInfo: data.totalUpdatedInfo ?? 0,
    totalPaid: data.totalPaid ?? 0,
    totalUnpaid: data.totalUnpaid ?? 0,
    totalUnsolvedRequest: data.totalUnsolvedRequest ?? 0,
    totalUnupdatedInfo: data.totalUnupdatedInfo ?? 0,
    totalSchools: data.totalSchools ?? 0,
    totalHighSchool: data.totalHighSchool ?? 0,
    totalUniversity: data.totalUniversity ?? 0,
    participatingSchools: Array.isArray(data.participatingSchools)
      ? data.participatingSchools
          .filter((item) => typeof item?.name === 'string' && item.name.trim().length > 0)
          .map((item) => ({
            name: (item.name as string).trim(),
            teams: Number(item.teams ?? 0),
          }))
      : [],
    unpaidAccounts: Array.isArray(data.unpaidAccounts)
      ? data.unpaidAccounts
          .filter((item) => Number.isFinite(Number(item?.id)))
          .map((item) => ({
            id: Number(item.id),
            username: (item.username ?? '').trim() || 'Chưa cập nhật',
            email: (item.email ?? '').trim() || 'Chưa cập nhật',
            teamName: (item.teamName ?? '').trim() || 'Chưa cập nhật',
            status: (item.status ?? 'Khởi tạo').trim() || 'Khởi tạo',
          }))
      : [],
    recentTeams,
    allTeams,
  };
}

export async function getAdminTeamDetail(teamId: number): Promise<AdminTeamDetail> {
  const response = await apiRequest<ApiResult<AdminTeamDetailApiData>>(`/api/v1/getTeamDetail/${teamId}`);

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể tải chi tiết đội');
  }

  const data = response.DT ?? {};

  return {
    id: data.id ?? teamId,
    userId: data.userId,
    teamName: data.teamName ?? '',
    coach: data.coach ?? 'Chưa cập nhật',
    school: data.school ?? 'Chưa cập nhật',
    paidImage: data.paidImage ?? null,
    isPaid: data.isPaid ?? null,
    rejectionReason: data.rejectionReason ?? null,
    status: data.status ?? 'Khởi tạo',
    participants: Array.isArray(data.participants) ? data.participants : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function deleteAdminTeam(teamId: number): Promise<void> {
  const response = await apiRequest<ApiResult<''>>(`/api/v1/deleteTeam/${teamId}`, {
    method: 'DELETE',
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Xóa đội thất bại');
  }
}

export async function updateAdminTeamStatus(
  teamId: number,
  status: AdminTeamStatus,
  rejectionReason?: string
): Promise<UpdateTeamStatusApiData> {
  const response = await apiRequest<ApiResult<UpdateTeamStatusApiData>>(`/api/v1/updateTeamStatus/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, rejectionReason }),
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Cập nhật trạng thái thất bại');
  }

  return response.DT ?? {};
}

export async function getAdminAccounts(): Promise<AdminAccountRow[]> {
  const response = await apiRequest<ApiResult<AllUsersData>>('/api/v1/getAllUsers');

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể tải danh sách tài khoản');
  }

  const rows = Array.isArray(response.DT?.rows) ? response.DT.rows : [];

  return rows
    .map((row) => ({
      id: Number(row.id),
      email: row.email ?? 'Chưa cập nhật',
      username: row.username ?? 'Chưa cập nhật',
      role: row.role ?? 'USER',
      teamName: normalizeAccountTeamName(row.teamName, row.role),
    }));
}

export async function getAdminAccountDetail(userId: number): Promise<AdminAccountDetail> {
  const response = await apiRequest<ApiResult<AdminUserDetailApiData>>(`/api/v1/getUserById/${userId}`);

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể tải chi tiết tài khoản');
  }

  const data = response.DT ?? {};
  const leaderName = data.representatives?.LEADER?.fullName?.trim() || '';
  const coachName = data.representatives?.COACH?.fullName?.trim() || '';
  const fallbackName = data.trainerName?.trim() || '';

  const representativeRole: AdminRepresentativeRole | null = leaderName
    ? 'LEADER'
    : coachName || fallbackName
    ? 'COACH'
    : null;

  const representativeName = leaderName || coachName || fallbackName || null;

  return {
    id: data.id ?? userId,
    email: data.email ?? 'Chưa cập nhật',
    username: data.username ?? 'Chưa cập nhật',
    role: data.role ?? 'USER',
    teamName: normalizeAccountTeamName(data.teamName, data.role),
    paidImage: data.paidImage ?? null,
    isPaid: data.isPaid ?? null,
    isUpdate: data.isUpdate ?? null,
    isHighSchool: data.isHighSchool ?? null,
    trainerName: data.trainerName ?? null,
    representativeName,
    representativeRole,
    participants: Array.isArray(data.Participants) ? data.Participants : [],
  };
}

export async function deleteAdminAccount(userId: number): Promise<void> {
  const response = await apiRequest<ApiResult<''>>(`/api/v1/deleteUser/${userId}`, {
    method: 'DELETE',
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Xóa tài khoản thất bại');
  }
}

// ===== HELP REQUEST INTERFACES & FUNCTIONS =====

export interface AdminHelpRequest {
  id: number;
  userId: number;
  userEmail: string;
  username: string;
  fullName: string;
  teamId?: number;
  teamName: string;
  schoolName: string;
  title: string;
  content: string;
  isSolve: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminHelpRequestDetail extends AdminHelpRequest {
  // Extended detail interface
}

export interface AdminHelpRequestsData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  requests: AdminHelpRequest[];
}

export async function getAdminHelpRequests(
  page: number = 1,
  limit: number = 10,
  filters?: { status?: string; search?: string }
): Promise<AdminHelpRequestsData> {
  const searchParams = new URLSearchParams();
  searchParams.append('page', page.toString());
  searchParams.append('limit', limit.toString());
  if (filters?.status) searchParams.append('status', filters.status);
  if (filters?.search) searchParams.append('search', filters.search);

  const response = await apiRequest<ApiResult<AdminHelpRequestsData>>(
    `/api/v1/getAllHelpRequest?${searchParams.toString()}`,
    {
      method: 'GET',
    }
  );

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Lấy danh sách yêu cầu hỗ trợ thất bại');
  }

  return response.DT;
}

export async function getAdminHelpRequestDetail(requestId: number): Promise<AdminHelpRequestDetail> {
  const response = await apiRequest<ApiResult<AdminHelpRequestDetail>>(
    `/api/v1/getHelpRequestById/${requestId}`,
    {
      method: 'GET',
    }
  );

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Lấy chi tiết yêu cầu hỗ trợ thất bại');
  }

  return response.DT;
}

export async function solveAdminHelpRequest(
  requestId: number,
  isSolve: boolean = true
): Promise<{ id: number; isSolve: boolean }> {
  const response = await apiRequest<ApiResult<{ id: number; isSolve: boolean }>>(
    `/api/v1/solveHelpRequest/${requestId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ isSolve }),
    }
  );

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Cập nhật trạng thái yêu cầu hỗ trợ thất bại');
  }

  return response.DT;
}
