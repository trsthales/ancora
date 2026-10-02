export type Persona = 'navegador' | 'apoio';

export interface User {
  id: string;
  email?: string | null;
  role: string;
  isAdult?: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  pseudonym: string;
  avatarId: string;
  persona: Persona;
  lastSeenAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  recoveryKey?: string;
  user: User;
  profile: Profile;
}

export interface RegisterResponse {
  accessToken?: string;
  refreshToken?: string;
  recoveryKey?: string;
  user: User;
  profile: Profile;
}

export interface RecoverRequest {
  pseudonym: string;
  recoveryKey: string;
  newPassword: string;
}

export interface RecoverResponse {
  accessToken: string;
  refreshToken: string;
  recoveryKey: string;
  user: User;
  profile: Profile;
}

export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
}
