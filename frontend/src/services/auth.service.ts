import type { AuthUser } from '../types/auth';
import { ROLES } from '../utils/role';
import { apiRequest, setAccessToken } from './http';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface ApiResult<TData> {
  EM: string;
  EC: number;
  DT: TData;
}

interface AuthApiData {
  id: number | string;
  email?: string;
  username?: string;
  role?: string;
  teamName?: string;
  isUpdate?: boolean | null;
  access_token?: string;
  accessToken?: string;
  token?: string;
}

function extractAccessToken(data: AuthApiData | undefined): string | undefined {
  if (!data) {
    return undefined;
  }

  return data.access_token ?? data.accessToken ?? data.token;
}

function toAuthUser(data: AuthApiData): AuthUser {
  const hasTeam = Boolean(
    data.teamName &&
      data.teamName !== 'Not updated yet / admin account' &&
      data.isUpdate !== false
  );

  return {
    id: String(data.id),
    name: data.username ?? data.email?.split('@')[0] ?? 'user',
    role: data.role === ROLES.ADMIN || data.role === ROLES.STAFF ? data.role : ROLES.USER,
    teamName: data.teamName,
    hasTeam,
  };
}

export async function loginWithCredentials(
  payload: LoginPayload
): Promise<AuthUser> {
  if (!payload.email || !payload.password) {
    throw new Error('Email and password are required');
  }

  const response = await apiRequest<ApiResult<AuthApiData>>('/api/v1/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Login failed');
  }

  setAccessToken(extractAccessToken(response.DT));

  return toAuthUser(response.DT);
}

export async function registerWithCredentials(
  payload: RegisterPayload
): Promise<AuthUser> {
  if (!payload.username || !payload.email || !payload.password) {
    throw new Error('Username, email and password are required');
  }

  const response = await apiRequest<ApiResult<AuthApiData>>('/api/v1/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.EC !== 0) {
    throw new Error(response.EM || 'Register failed');
  }

  setAccessToken(extractAccessToken(response.DT));

  return toAuthUser(response.DT);
}

export async function loginWithDemoCredentials(
  payload: LoginPayload
): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  if (!payload.email || !payload.password) {
    throw new Error('Email and password are required');
  }

  return {
    id: 'demo-user',
    name: payload.email.split('@')[0] || 'user',
    role: ROLES.USER,
  };
}
