import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type {
  User,
  Profile,
  AuthResponse,
  RegisterResponse,
  ApiSuccessResponse,
  Persona,
} from '../types/auth';
import { apiFetch, recoverAccountApi, deleteAccountApi, setOnAuthFailureCallback, ApiError } from '../services/api';
import { storage } from '../services/storage';

interface PendingRecoverySession {
  user: User;
  profile: Profile;
  accessToken: string;
  refreshToken: string;
  recoveryKey: string;
}

interface AuthContextData {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  justRegistered: boolean;
  recoveryKey: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    password: string,
    isAdult: boolean,
    persona: Persona,
    healthDataConsent?: boolean,
  ) => Promise<void>;
  recoverAccount: (pseudonym: string, recoveryKey: string, newPassword: string) => Promise<string>;
  completeAccountRecovery: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  acknowledgeIdentity: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [justRegistered, setJustRegistered] = useState<boolean>(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [pendingRecovery, setPendingRecovery] = useState<PendingRecoverySession | null>(null);

  useEffect(() => {
    setOnAuthFailureCallback(() => {
      setUser(null);
      setProfile(null);
      setRecoveryKey(null);
      setJustRegistered(false);
      setPendingRecovery(null);
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

        // Tenta restaurar do cache local caso offline
        const cachedUserStr = await storage.getItem('cachedUser');
        const cachedProfileStr = await storage.getItem('cachedProfile');
        if (cachedUserStr && cachedProfileStr) {
          try {
            setUser(JSON.parse(cachedUserStr));
            setProfile(JSON.parse(cachedProfileStr));
          } catch {
            // Ignora falhas de parse de dados antigos
          }
        }

        const response =
          await apiFetch<ApiSuccessResponse<{ user: User; profile: Profile }>>('/auth/me');
        if (response?.data?.user && response?.data?.profile) {
          setUser(response.data.user);
          setProfile(response.data.profile);
          await storage.setItem('cachedUser', JSON.stringify(response.data.user));
          await storage.setItem('cachedProfile', JSON.stringify(response.data.profile));
        }
      } catch (error) {
        // Limpar storage estritamente em caso de HTTP 401 explícito da API
        if (error instanceof ApiError && error.status === 401) {
          await storage.removeItem('accessToken');
          await storage.removeItem('refreshToken');
          await storage.removeItem('cachedUser');
          await storage.removeItem('cachedProfile');
          setUser(null);
          setProfile(null);
        }
        // Se for erro genérico de rede (status 0) ou erro 5xx do servidor,
        // NUNCA apagar tokens do storage!
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
    await storage.setItem('cachedUser', JSON.stringify(loggedUser));
    await storage.setItem('cachedProfile', JSON.stringify(loggedProfile));

    setUser(loggedUser);
    setProfile(loggedProfile);
    setRecoveryKey(null);
    setJustRegistered(false);
    setPendingRecovery(null);
  };

  const register = async (
    password: string,
    isAdult: boolean,
    persona: Persona,
    healthDataConsent: boolean = true,
  ): Promise<void> => {
    const regResponse = await apiFetch<ApiSuccessResponse<RegisterResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ password, isAdult, persona, healthDataConsent }),
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
    await storage.setItem('cachedUser', JSON.stringify(registeredUser));
    await storage.setItem('cachedProfile', JSON.stringify(registeredProfile));

    setUser(registeredUser);
    setProfile(registeredProfile);
    setRecoveryKey(returnedRecoveryKey || null);
    setJustRegistered(true);
    setPendingRecovery(null);
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

    // Retém os dados da sessão em estado pendente sem ativar imediatamente,
    // evitando a desmontagem prematura do modal antes do usuário visualizar e salvar a chave
    setPendingRecovery({
      user: recoveredUser,
      profile: recoveredProfile,
      accessToken,
      refreshToken,
      recoveryKey: newRecoveryKey,
    });

    return newRecoveryKey;
  };

  const completeAccountRecovery = async (): Promise<void> => {
    if (!pendingRecovery) {
      return;
    }

    const {
      accessToken,
      refreshToken,
      user: recoveredUser,
      profile: recoveredProfile,
      recoveryKey: newRecoveryKey,
    } = pendingRecovery;

    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);
    await storage.setItem('cachedUser', JSON.stringify(recoveredUser));
    await storage.setItem('cachedProfile', JSON.stringify(recoveredProfile));

    setUser(recoveredUser);
    setProfile(recoveredProfile);
    setRecoveryKey(newRecoveryKey);
    setJustRegistered(false);
    setPendingRecovery(null);
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
      await storage.removeItem('cachedUser');
      await storage.removeItem('cachedProfile');
      setUser(null);
      setProfile(null);
      setRecoveryKey(null);
      setJustRegistered(false);
      setPendingRecovery(null);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    try {
      await deleteAccountApi();
    } finally {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      await storage.removeItem('cachedUser');
      await storage.removeItem('cachedProfile');
      setUser(null);
      setProfile(null);
      setRecoveryKey(null);
      setJustRegistered(false);
      setPendingRecovery(null);
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
      completeAccountRecovery,
      logout,
      deleteAccount,
      acknowledgeIdentity,
    }),
    [user, profile, isLoading, justRegistered, recoveryKey, pendingRecovery],
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
