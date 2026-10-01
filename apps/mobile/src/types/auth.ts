export type Persona = 'navegador' | 'apoio';

export interface User {
  id: string;
  email: string;
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
  user: User;
  profile: Profile;
}

export interface RegisterResponse {
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
