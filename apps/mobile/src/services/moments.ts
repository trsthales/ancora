import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MomentConfig } from '../types/habits';

const MOMENTS_STORAGE_KEY = '@ancora_my_moments';
export const MAX_MOMENTS = 3;

// Configuração do handler neutro de notificações
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Ignora erros em plataformas não suportadas
}

export const DEFAULT_MOMENTS: MomentConfig[] = [
  {
    id: 'moment_fri_18',
    label: 'Sexta-feira 18:00',
    hour: 18,
    minute: 0,
    dayOfWeek: 6, // Sexta-feira (1 = Dom, 2 = Seg, ..., 6 = Sex)
    selectedActions: ['Café da manhã com calma', 'Beber água ao longo do dia'],
    enabled: true,
  },
  {
    id: 'moment_sun_20',
    label: 'Domingo 20:00',
    hour: 20,
    minute: 0,
    dayOfWeek: 1, // Domingo
    selectedActions: ['Dormir em um horário regular', 'Leitura de um livro'],
    enabled: true,
  },
];

/**
 * Solicita permissão para notificações locais caso ainda não tenha sido concedida.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[moments] Erro ao requisitar permissões de notificação:', err);
    return false;
  }
}

/**
 * Carrega os momentos configurados pelo usuário (máximo 3).
 */
export async function loadMoments(): Promise<MomentConfig[]> {
  try {
    const json = await AsyncStorage.getItem(MOMENTS_STORAGE_KEY);
    if (!json) {
      return DEFAULT_MOMENTS;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_MOMENTS) : DEFAULT_MOMENTS;
  } catch {
    return DEFAULT_MOMENTS;
  }
}

/**
 * Salva a lista de momentos e reagenda os gatilhos locais via expo-notifications.
 */
export async function saveMoments(moments: MomentConfig[]): Promise<void> {
  if (moments.length > MAX_MOMENTS) {
    throw new Error(`É permitido agendar no máximo ${MAX_MOMENTS} momentos.`);
  }

  await AsyncStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(moments));
  await syncScheduledNotifications(moments);
}

/**
 * Cancela e reagenda todos os gatilhos locais ativos no dispositivo (100% offline).
 */
export async function syncScheduledNotifications(moments: MomentConfig[]): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Cancela todas as notificações de momentos existentes
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.identifier.startsWith('moment_')) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }

    // Reagenda os momentos habilitados
    for (const moment of moments) {
      if (!moment.enabled) continue;

      const trigger =
        moment.dayOfWeek !== null
          ? {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: moment.dayOfWeek,
              hour: moment.hour,
              minute: moment.minute,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: moment.hour,
              minute: moment.minute,
            };

      await Notifications.scheduleNotificationAsync({
        identifier: `moment_${moment.id}`,
        content: {
          title: 'Lembrete',
          body: 'Seu momento do dia chegou. Quer olhar sua lista?',
          data: {
            momentId: moment.id,
            actions: moment.selectedActions,
          },
        },
        trigger: trigger as any,
      });
    }
  } catch (err) {
    console.warn('[moments] Erro ao sincronizar notificações de momentos:', err);
  }
}

export const momentsService = {
  loadMoments,
  saveMoments,
  syncScheduledNotifications,
  requestNotificationPermissions,
};
