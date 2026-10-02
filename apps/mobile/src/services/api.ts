import { Platform } from 'react-native';
import { storage } from './storage';

export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3333/api/v1',
  default: 'http://localhost:3333/api/v1',
});

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export type AuthFailureCallback = () => void;
let onAuthFailureCallback: AuthFailureCallback | null = null;

export function setOnAuthFailureCallback(callback: AuthFailureCallback | null): void {
  onAuthFailureCallback = callback;
}

export function getIsRefreshing(): boolean {
  return isRefreshing;
}

export async function refreshAuthTokens(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise; // Reutiliza a Promise em andamento (Mutex)
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const currentRefreshToken = await storage.getItem('refreshToken');
      if (!currentRefreshToken) {
        throw new Error('Sem refresh token');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao renovar token (${response.status})`);
      }

      const payload = await response.json();
      const accessToken = payload?.data?.accessToken;
      const newRefreshToken = payload?.data?.refreshToken;

      if (!accessToken) {
        throw new Error('Novo accessToken ausente na resposta de renovação');
      }

      await storage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        await storage.setItem('refreshToken', newRefreshToken);
      }

      return accessToken;
    } catch {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      onAuthFailureCallback?.(); // Desloga o usuário
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const AUTH_BYPASS_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/recover',
  '/auth/logout',
];

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  let targetPath = endpoint;
  if (targetPath.startsWith('/api/v1/')) {
    targetPath = targetPath.slice('/api/v1'.length);
  }

  const url = targetPath.startsWith('http')
    ? targetPath
    : `${API_BASE_URL}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;

  const token = await storage.getItem('accessToken');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const isAuthBypassEndpoint = AUTH_BYPASS_ENDPOINTS.some((bypassPath) =>
        targetPath.includes(bypassPath),
      );

      if (response.status === 401 && !isRetry && !isAuthBypassEndpoint) {
        const currentToken = await storage.getItem('accessToken');
        let newAccessToken: string | null = null;

        // Se outro refresh concorrente já concluiu enquanto esta requisição estava em voo:
        if (currentToken && token && currentToken !== token) {
          newAccessToken = currentToken;
        } else {
          newAccessToken = await refreshAuthTokens();
        }

        if (newAccessToken) {
          const retryHeaders: Record<string, string> = {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          delete retryHeaders.authorization;

          return apiFetch<T>(endpoint, { ...options, headers: retryHeaders }, true);
        }
      }

      const errorMessage =
        data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
        `Erro na requisição (${response.status})`;
      throw new ApiError(errorMessage, response.status, data?.errors);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Falha ao conectar com o servidor.';
    throw new ApiError(message, 0);
  }
}

export async function recoverAccountApi(
  payload: import('../types/auth').RecoverRequest,
): Promise<import('../types/auth').ApiSuccessResponse<import('../types/auth').RecoverResponse>> {
  return apiFetch<
    import('../types/auth').ApiSuccessResponse<import('../types/auth').RecoverResponse>
  >('/auth/recover', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAccountApi(): Promise<{ status: string; message: string }> {
  return apiFetch<{ status: string; message: string }>('/account', {
    method: 'DELETE',
  });
}

