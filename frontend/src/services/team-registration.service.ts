import { apiRequest } from './http';

export type TeamRegistrationPayload = Record<string, unknown>;

export interface TeamRegistrationResponse {
  message?: string;
  data?: unknown;
}

export function submitTeamRegistration(payload: TeamRegistrationPayload) {
  return apiRequest<TeamRegistrationResponse>('/api/v1/update-info', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
