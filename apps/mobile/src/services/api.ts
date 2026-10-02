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

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  payload: import('../types/auth').RecoverRequest
): Promise<import('../types/auth').ApiSuccessResponse<import('../types/auth').RecoverResponse>> {
  return apiFetch<import('../types/auth').ApiSuccessResponse<import('../types/auth').RecoverResponse>>(
    '/auth/recover',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

