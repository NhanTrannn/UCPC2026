export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
