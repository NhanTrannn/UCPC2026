import { apiRequest } from './http';

export type TeamRegistrationPayload = Record<string, unknown>;

export interface TeamRegistrationResponse {
  message?: string;
  data?: unknown;
  EM?: string;
  EC?: number;
  DT?: unknown;
}

interface FormMember {
  fullName?: string;
  phone?: string;
  birth?: string;
  university?: string;
  CCCD?: string;
}

interface FormPayload {
  teamName?: string;
  instructorName?: string;
  instructorPhone?: string;
  instructorEmail?: string;
  instructorSchoolName?: string;
  representativeRole?: 'LEADER' | 'COACH';
  level?: string;
  members?: FormMember[];
  paidImage?: string;
}

interface UpdateInfoPayload {
  userId?: string | number;
  teamName: string;
  isHighSchool: string;
  trainerName: string;
  representativeRole: 'LEADER' | 'COACH';
  leaderName?: string;
  leaderPhone?: string;
  leaderEmail?: string;
  leaderSchoolName?: string;
  coachName?: string;
  coachPhone?: string;
  coachEmail?: string;
  coachSchoolName?: string;
  paidImage: string;
  Participants: Array<{
    fullName: string;
    citizenId: string;
    phone: string;
    birth: string;
    schoolName: string;
  }>;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getUserIdFromAccessToken(): string | number | undefined {
  const token =
    localStorage.getItem('ucpc_access_token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('ucpc_token');

  if (!token) return undefined;
  const payload = decodeJwtPayload(token);
  const userId = payload?.id;

  if (typeof userId === 'string' || typeof userId === 'number') {
    return userId;
  }

  return undefined;
}

function toDdMmYyyy(dateValue?: string): string {
  if (!dateValue) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
    return dateValue;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return dateValue;

  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeSchoolName(value?: string): string {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('vi-VN');
}

function mapToUpdateInfoPayload(payload: TeamRegistrationPayload): UpdateInfoPayload {
  const data = payload as FormPayload;
  const members = Array.isArray(data.members) ? data.members : [];
  const representativeRole = data.representativeRole === 'LEADER' ? 'LEADER' : 'COACH';

  const representativeFields =
    representativeRole === 'LEADER'
      ? {
          leaderName: data.instructorName ?? '',
          leaderPhone: data.instructorPhone ?? '',
          leaderEmail: data.instructorEmail ?? '',
          leaderSchoolName: normalizeSchoolName(data.instructorSchoolName),
        }
      : {
          coachName: data.instructorName ?? '',
          coachPhone: data.instructorPhone ?? '',
          coachEmail: data.instructorEmail ?? '',
          coachSchoolName: normalizeSchoolName(data.instructorSchoolName),
        };

  return {
    userId: getUserIdFromAccessToken(),
    teamName: data.teamName ?? '',
    isHighSchool: data.level === 'highschool' ? 'true' : 'false',
    trainerName: representativeRole === 'COACH' ? data.instructorName ?? '' : '',
    representativeRole,
    ...representativeFields,
    paidImage: data.paidImage ?? '',
    Participants: members.map((member) => ({
      fullName: member.fullName ?? '',
      citizenId: member.CCCD ?? '',
      phone: member.phone ?? '',
      birth: toDdMmYyyy(member.birth),
      schoolName: member.university ?? '',
    })),
  };
}

export function submitTeamRegistration(payload: TeamRegistrationPayload) {
  const mappedPayload = mapToUpdateInfoPayload(payload);

  return apiRequest<TeamRegistrationResponse>('/api/v1/update-info', {
    method: 'PUT',
    body: JSON.stringify(mappedPayload),
  });
}
