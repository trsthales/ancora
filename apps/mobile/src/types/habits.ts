export interface Habit {
  id: string;
  chipId: string;
  completed: boolean;
  createdAt: string;
}

export interface LocalTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export type RoutineItemType = 'official' | 'local';

export interface UnifiedRoutineItem {
  id: string;
  type: RoutineItemType;
  title: string;
  icon: string;
  category?: string;
  completed: boolean;
  chipId?: string;
  createdAt: string;
}

export interface HabitsApiResponse {
  habits: Habit[];
  dateKey: string;
}

export interface CreateHabitResponse {
  habit: {
    id: string;
    chipId: string;
    createdAt: string;
  };
}

export interface UpdateHabitLogResponse {
  habitId: string;
  dateKey: string;
  completed: boolean;
}

export interface MomentConfig {
  id: string;
  label: string; // ex: "Sexta 18:00", "Diário 17:30"
  hour: number;
  minute: number;
  dayOfWeek: number | null; // null = diário; 1 = Domingo, 2 = Segunda, ..., 6 = Sexta, 7 = Sábado
  selectedActions: string[]; // 1 a 3 ações escolhidas
  enabled: boolean;
}

export interface WeeklyReviewData {
  totalActiveDays: number;
  habitsPresence: {
    habitTitle: string;
    icon: string;
    daysCount: number;
  }[];
  reflectionPrompt: string;
}
