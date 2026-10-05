import { apiFetch } from './api';
import { Habit, HabitsApiResponse, CreateHabitResponse, UpdateHabitLogResponse } from '../types/habits';

/**
 * Retorna a data local de hoje no formato YYYY-MM-DD
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const habitsService = {
  /**
   * Consome GET /api/v1/journey/habits?dateKey=...
   * Retorna os hábitos cadastrados do usuário com status de conclusão na data.
   */
  async getHabits(dateKey?: string): Promise<HabitsApiResponse> {
    const key = dateKey || getTodayDateKey();
    const response = await apiFetch<{ status?: string; data?: HabitsApiResponse } & HabitsApiResponse>(
      `/api/v1/journey/habits?dateKey=${encodeURIComponent(key)}`,
      { method: 'GET' },
    );

    return response.data ?? response;
  },

  /**
   * Consome POST /api/v1/journey/habits
   * Cria um novo hábito a partir de um chip do catálogo canônico.
   */
  async createHabit(chipId: string): Promise<CreateHabitResponse> {
    const response = await apiFetch<{ status?: string; data?: CreateHabitResponse } & CreateHabitResponse>(
      '/api/v1/journey/habits',
      {
        method: 'POST',
        body: JSON.stringify({ chipId }),
      },
    );

    return response.data ?? response;
  },

  /**
   * Consome PUT /api/v1/journey/habits/:id/logs/:dateKey
   * Atualiza a conclusão de um hábito de forma idempotente.
   */
  async updateHabitLog(
    habitId: string,
    dateKey: string,
    completed: boolean,
  ): Promise<UpdateHabitLogResponse> {
    const response = await apiFetch<
      { status?: string; data?: UpdateHabitLogResponse } & UpdateHabitLogResponse
    >(`/api/v1/journey/habits/${encodeURIComponent(habitId)}/logs/${encodeURIComponent(dateKey)}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });

    return response.data ?? response;
  },

  /**
   * Consome DELETE /api/v1/journey/habits/:id
   * Remove o hábito e seus logs associados.
   */
  async deleteHabit(habitId: string): Promise<{ status: string; message: string }> {
    return await apiFetch<{ status: string; message: string }>(
      `/api/v1/journey/habits/${encodeURIComponent(habitId)}`,
      {
        method: 'DELETE',
      },
    );
  },
};
