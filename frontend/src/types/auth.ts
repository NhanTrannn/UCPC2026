import type { Role } from '../utils/role';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}
