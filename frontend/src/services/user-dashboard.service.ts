import { apiRequest } from './http';

interface ApiResult<TData> {
  EM: string;
  EC: number;
  DT: TData;
}

interface UserDashboardApiData {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  teamName?: string;
  isPaid?: boolean;
  isUpdate?: boolean;
  isHighSchool?: boolean | null;
  trainerName?: string | null;
  representatives?: Partial<Record<'LEADER' | 'COACH', {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    schoolName?: string | null;
  }>>;
  rejectionReason?: string | null;
  Participants?: Array<{
    id?: number;
    fullName?: string;
    citizenId?: string;
    phone?: string;
    birth?: string;
    schoolName?: string;
  }>;
}

export type RegistrationStatus = 'confirmed' | 'pending' | 'not-submitted';

export interface UserDashboardInfo {
  accountId: number | null;
  username: string;
  email: string;
  role: string;
  teamName: string;
  trainerName: string;
  blockLabel: string;
  updateLabel: string;
  isPaid: boolean;
  paymentLabel: string;
  rejectionReason: string | null;
  participantCount: number;
  participants: Array<{
    id: number | null;
    fullName: string;
    citizenId: string;
    phone: string;
    birth: string;
    schoolName: string;
  }>;
  status: RegistrationStatus;
  statusLabel: string;
}

interface UserHelpRequestApiData {
  id?: number;
  title?: string;
  data?: string;
  response?: string;
  isSolve?: boolean;
}

export interface UserHelpRequest {
  id: number;
  title: string;
  content: string;
  response: string;
  isSolved: boolean;
}

function getStatus(data: UserDashboardApiData): RegistrationStatus {
  const teamName = (data.teamName ?? '').toLowerCase();
  const hasTeam = teamName.length > 0 && !teamName.includes('not updated yet');

  if (!hasTeam) {
    return 'not-submitted';
  }

  if (data.isUpdate === true && data.isPaid === true) {
    return 'confirmed';
  }

  return 'pending';
}

function getStatusLabel(status: RegistrationStatus): string {
  if (status === 'confirmed') return 'Đã được xác nhận';
  if (status === 'pending') return 'Đang chờ xác nhận';
  return 'Chưa hoàn tất đăng ký';
}

function getBlockLabel(isHighSchool: boolean | null | undefined): string {
  if (isHighSchool === true) return 'THPT';
  if (isHighSchool === false) return 'Đại học';
  return 'Chưa cập nhật';
}

function getUpdateLabel(isUpdate: boolean | undefined): string {
  if (isUpdate === true) return 'Đã gửi hồ sơ';
  return 'Chưa gửi hồ sơ';
}

function getPaymentLabel(isPaid: boolean | undefined): string {
  if (isPaid === true) return 'Đã xác nhận thanh toán';
  return 'Chưa xác nhận thanh toán';
}

export async function getUserDashboardInfo(): Promise<UserDashboardInfo> {
  const response = await apiRequest<ApiResult<UserDashboardApiData>>('/api/v1/getCurrentUserProfile');

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể tải dashboard user');
  }

  const data = response.DT ?? {};
  const status = getStatus(data);
  const leaderName = data.representatives?.LEADER?.fullName?.trim() || '';
  const coachName = data.representatives?.COACH?.fullName?.trim() || '';
  const fallbackName = data.trainerName?.trim() || '';
  const representativeName = leaderName || coachName || fallbackName || 'Chưa cập nhật';

  return {
    accountId: typeof data.id === 'number' ? data.id : null,
    username: data.username ?? 'Người dùng',
    email: data.email ?? 'Chưa cập nhật',
    role: data.role ?? 'USER',
    teamName: data.teamName ?? 'Chưa cập nhật',
    trainerName: representativeName,
    blockLabel: getBlockLabel(data.isHighSchool),
    updateLabel: getUpdateLabel(data.isUpdate),
    isPaid: data.isPaid === true,
    paymentLabel: getPaymentLabel(data.isPaid),
    rejectionReason: data.rejectionReason ?? null,
    participantCount: Array.isArray(data.Participants) ? data.Participants.length : 0,
    participants: Array.isArray(data.Participants)
      ? data.Participants.map((participant) => ({
          id: typeof participant.id === 'number' ? participant.id : null,
          fullName: participant.fullName ?? 'Chưa cập nhật',
          citizenId: participant.citizenId ?? 'Chưa cập nhật',
          phone: participant.phone ?? 'Chưa cập nhật',
          birth: participant.birth ?? 'Chưa cập nhật',
          schoolName: participant.schoolName ?? 'Chưa cập nhật',
        }))
      : [],
    status,
    statusLabel: getStatusLabel(status),
  };
}

export async function uploadPaymentProof(paidImage: string): Promise<void> {
  const response = await apiRequest<ApiResult<unknown>>('/api/v1/upload-payment-proof', {
    method: 'PUT',
    body: JSON.stringify({ paidImage }),
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể nộp lại minh chứng');
  }
}

export async function changeUserPassword(oldPassword: string, newPassword: string): Promise<void> {
  if (!oldPassword || !newPassword) {
    throw new Error('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới');
  }

  const response = await apiRequest<ApiResult<unknown>>('/api/v1/changePassword', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể đổi mật khẩu');
  }
}

export async function sendUserHelpRequest(title: string, content: string): Promise<void> {
  if (!title.trim() || !content.trim()) {
    throw new Error('Vui lòng nhập tiêu đề và nội dung yêu cầu');
  }

  const response = await apiRequest<ApiResult<unknown>>('/api/v1/sendHelpRequest', {
    method: 'POST',
    body: JSON.stringify({
      title: title.trim(),
      data: content.trim(),
    }),
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể gửi yêu cầu hỗ trợ');
  }
}

export async function getUserHelpRequests(userId: number): Promise<UserHelpRequest[]> {
  const response = await apiRequest<ApiResult<UserHelpRequestApiData[] | ''>>(`/api/v1/getHelpByUser/${userId}`);

  if (response.EC === -1 && typeof response.EM === 'string' && response.EM.includes('There is no help request')) {
    return [];
  }

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể tải yêu cầu hỗ trợ');
  }

  const rows = Array.isArray(response.DT) ? response.DT : [];

  return rows.map((row) => ({
    id: Number(row.id ?? 0),
    title: row.title ?? 'Không có tiêu đề',
    content: row.data ?? '',
    response: row.response ?? 'No response yet',
    isSolved: row.isSolve === true,
  }));
}

export async function deleteUserHelpRequest(requestId: number): Promise<void> {
  const response = await apiRequest<ApiResult<unknown>>(`/api/v1/deleteHelpRequest/${requestId}`, {
    method: 'DELETE',
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Không thể xóa yêu cầu hỗ trợ');
  }
}
