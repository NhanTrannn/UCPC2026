const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const ACCESS_TOKEN_STORAGE_KEY = 'ucpc_access_token';
const LEGACY_ACCESS_TOKEN_KEYS = ['access_token', 'token', 'ucpc_token'];

export function setAccessToken(token: string | null | undefined): void {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function getAccessToken(): string | null {
  const currentToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (currentToken) {
    return currentToken;
  }

  // Backward compatibility: migrate token from legacy keys if present.
  for (const legacyKey of LEGACY_ACCESS_TOKEN_KEYS) {
    const legacyToken = localStorage.getItem(legacyKey);
    if (legacyToken) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, legacyToken);
      return legacyToken;
    }
  }

  return null;
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  for (const legacyKey of LEGACY_ACCESS_TOKEN_KEYS) {
    localStorage.removeItem(legacyKey);
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string; EM?: string };
      if (body?.message) {
        message = body.message;
      } else if (body?.EM) {
        message = body.EM;
      }
    } catch {
      // Keep fallback message when response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get('Content-Type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as TResponse;
  }

  return (await response.text()) as TResponse;
}

export function getErrorMessage(error: unknown): string {
  return toErrorMessage(error);
}
