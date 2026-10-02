import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type {
  User,
  Profile,
  AuthResponse,
  RegisterResponse,
  ApiSuccessResponse,
  Persona,
} from '../types/auth';
import { apiFetch, recoverAccountApi, setOnAuthFailureCallback } from '../services/api';
import { storage } from '../services/storage';

interface AuthContextData {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  justRegistered: boolean;
  recoveryKey: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (password: string, isAdult: boolean, persona: Persona) => Promise<void>;
  recoverAccount: (pseudonym: string, recoveryKey: string, newPassword: string) => Promise<string>;
  logout: () => Promise<void>;
  acknowledgeIdentity: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [justRegistered, setJustRegistered] = useState<boolean>(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);

  useEffect(() => {
    setOnAuthFailureCallback(() => {
      setUser(null);
      setProfile(null);
      setRecoveryKey(null);
      setJustRegistered(false);
    });

    return () => {
      setOnAuthFailureCallback(null);
    };
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await storage.getItem('accessToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response =
          await apiFetch<ApiSuccessResponse<{ user: User; profile: Profile }>>('/auth/me');
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

  const login = async (identifier: string, password: string): Promise<void> => {
    const response = await apiFetch<ApiSuccessResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    const { accessToken, refreshToken, user: loggedUser, profile: loggedProfile } = response.data;
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);

    setUser(loggedUser);
    setProfile(loggedProfile);
    setRecoveryKey(null);
    setJustRegistered(false);
  };

  const register = async (password: string, isAdult: boolean, persona: Persona): Promise<void> => {
    const regResponse = await apiFetch<ApiSuccessResponse<RegisterResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ password, isAdult, persona }),
    });

    const {
      accessToken,
      refreshToken,
      recoveryKey: returnedRecoveryKey,
      user: registeredUser,
      profile: registeredProfile,
    } = regResponse.data;

    if (accessToken) {
      await storage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      await storage.setItem('refreshToken', refreshToken);
    }

    setUser(registeredUser);
    setProfile(registeredProfile);
    setRecoveryKey(returnedRecoveryKey || null);
    setJustRegistered(true);
  };

  const recoverAccount = async (
    pseudonym: string,
    recoveryKeyInput: string,
    newPassword: string,
  ): Promise<string> => {
    const response = await recoverAccountApi({
      pseudonym,
      recoveryKey: recoveryKeyInput,
      newPassword,
    });

    const {
      accessToken,
      refreshToken,
      recoveryKey: newRecoveryKey,
      user: recoveredUser,
      profile: recoveredProfile,
    } = response.data;

    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);

    setUser(recoveredUser);
    setProfile(recoveredProfile);
    setRecoveryKey(newRecoveryKey);
    setJustRegistered(false);

    return newRecoveryKey;
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
      setRecoveryKey(null);
      setJustRegistered(false);
    }
  };

  const acknowledgeIdentity = () => {
    setJustRegistered(false);
    setRecoveryKey(null);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: Boolean(user && profile),
      justRegistered,
      recoveryKey,
      login,
      register,
      recoverAccount,
      logout,
      acknowledgeIdentity,
    }),
    [user, profile, isLoading, justRegistered, recoveryKey],
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
