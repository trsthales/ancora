import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Profile, AuthResponse, RegisterResponse, ApiSuccessResponse, Persona } from '../types/auth';
import { apiFetch } from '../services/api';
import { storage } from '../services/storage';

interface AuthContextData {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  justRegistered: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, isAdult: boolean, persona: Persona) => Promise<void>;
  logout: () => Promise<void>;
  acknowledgeIdentity: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [justRegistered, setJustRegistered] = useState<boolean>(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await storage.getItem('accessToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await apiFetch<ApiSuccessResponse<{ user: User; profile: Profile }>>('/auth/me');
        if (response?.data?.user && response?.data?.profile) {
          setUser(response.data.user);
          setProfile(response.data.profile);
        } else {
          await storage.removeItem('accessToken');
          await storage.removeItem('refreshToken');
        }
      } catch {
        await storage.removeItem('accessToken');
        await storage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiFetch<ApiSuccessResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { accessToken, refreshToken, user: loggedUser, profile: loggedProfile } = response.data;
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);

    setUser(loggedUser);
    setProfile(loggedProfile);
    setJustRegistered(false);
  };

  const register = async (
    email: string,
    password: string,
    isAdult: boolean,
    persona: Persona,
  ): Promise<void> => {
    // 1. Registrar conta na API
    const regResponse = await apiFetch<ApiSuccessResponse<RegisterResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, isAdult, persona }),
    });

    // 2. Fazer login automático para obter os tokens
    const loginResponse = await apiFetch<ApiSuccessResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { accessToken, refreshToken, user: loggedUser, profile: loggedProfile } = loginResponse.data;
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);

    setUser(loggedUser || regResponse.data.user);
    setProfile(loggedProfile || regResponse.data.profile);
    setJustRegistered(true);
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignora falhas no backend durante o logout para garantir a limpeza local
    } finally {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      setUser(null);
      setProfile(null);
      setJustRegistered(false);
    }
  };

  const acknowledgeIdentity = () => {
    setJustRegistered(false);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: Boolean(user && profile),
      justRegistered,
      login,
      register,
      logout,
      acknowledgeIdentity,
    }),
    [user, profile, isLoading, justRegistered],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
