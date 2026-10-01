import { apiFetch } from './api';

export type MoodType = 'calmo' | 'ansioso' | 'cansado' | 'vulneravel' | 'motivado';

export interface Checkin {
  id: string;
  cravingLevel: number;
  mood: MoodType;
  createdAt: string;
}

export interface CheckinResponse {
  checkin: Checkin;
}

export interface TodayCheckinResponse {
  hasCheckedInToday: boolean;
  checkin: Checkin | null;
}

export interface HistoryResponse {
  totalCheckins: number;
  history: Checkin[];
}

export const journeyService = {
  /**
   * Registra um novo check-in diário de nível de fissura (0 a 5) e humor
   */
  async createCheckin(cravingLevel: number, mood: string): Promise<CheckinResponse> {
    const response = await apiFetch<{ status?: string; data?: CheckinResponse } & CheckinResponse>(
      '/journey/checkin',
      {
        method: 'POST',
        body: JSON.stringify({ cravingLevel, mood }),
      },
    );

    return response.data ?? response;
  },

  /**
   * Consulta se o usuário já fez check-in no dia atual e traz o registro mais recente
   */
  async getTodayCheckin(): Promise<TodayCheckinResponse> {
    const response = await apiFetch<{ status?: string; data?: TodayCheckinResponse } & TodayCheckinResponse>(
      '/journey/today',
    );

    return response.data ?? response;
  },

  /**
   * Obtém o total acumulado de check-ins e o histórico recente
   */
  async getHistory(limit = 30): Promise<HistoryResponse> {
    const response = await apiFetch<{ status?: string; data?: HistoryResponse } & HistoryResponse>(
      `/journey/history?limit=${limit}`,
    );

    return response.data ?? response;
  },

  /**
   * Alias de compatibilidade para getHistory
   */
  async getJourneyHistory(limit = 30): Promise<HistoryResponse> {
    return this.getHistory(limit);
  },
};
