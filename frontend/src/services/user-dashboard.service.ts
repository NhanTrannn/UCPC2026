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

  return {
    accountId: typeof data.id === 'number' ? data.id : null,
    username: data.username ?? 'Người dùng',
    email: data.email ?? 'Chưa cập nhật',
    role: data.role ?? 'USER',
    teamName: data.teamName ?? 'Chưa cập nhật',
    trainerName: data.trainerName ?? 'Chưa cập nhật',
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
