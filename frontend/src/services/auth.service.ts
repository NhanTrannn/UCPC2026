import type { AuthUser } from '../types/auth';
import { ROLES } from '../utils/role';

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginWithCredentials(
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
