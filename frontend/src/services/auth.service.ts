import type { AuthUser } from '../types/auth';
import { ROLES } from '../utils/role';
import { apiRequest } from './http';

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
}

function toAuthUser(data: AuthApiData): AuthUser {
  return {
    id: String(data.id),
    name: data.username ?? data.email?.split('@')[0] ?? 'user',
    role: data.role === ROLES.ADMIN || data.role === ROLES.STAFF ? data.role : ROLES.USER,
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
