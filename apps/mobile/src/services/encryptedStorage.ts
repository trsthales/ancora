import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LocalTask } from '../types/habits';

const LOCAL_KEY_ALIAS = 'LOCAL_ENCRYPTION_KEY';
const STORAGE_KEY = '@ancora_local_tasks_enc';
export const MAX_LOCAL_TASKS = 10;
export const MIN_TITLE_LENGTH = 2;
export const MAX_TITLE_LENGTH = 60;

let inMemoryKey: string | null = null;

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    hex += (b !== undefined ? b : 0).toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Obtém ou gera uma chave simétrica AES-256 (32 bytes) protegida por hardware.
 * No dispositivo físico utiliza SecureStore com WHEN_UNLOCKED_THIS_DEVICE_ONLY.
 * No ambiente Web utiliza fallback para localStorage / chave em memória.
 */
export async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  let hexKey: string | null = null;

  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        hexKey = window.localStorage.getItem(LOCAL_KEY_ALIAS);
      } else {
        hexKey = inMemoryKey;
      }
    } catch {
      hexKey = inMemoryKey;
    }
  } else {
    try {
      hexKey = await SecureStore.getItemAsync(LOCAL_KEY_ALIAS);
    } catch (err) {
      console.warn('[encryptedStorage] Falha ao ler SecureStore:', err);
    }
  }

  if (!hexKey || hexKey.length !== 64) {
    const rawKey = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(rawKey);
    } else {
      for (let i = 0; i < 32; i++) {
        rawKey[i] = Math.floor(Math.random() * 256);
      }
    }

    hexKey = bytesToHex(rawKey);

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(LOCAL_KEY_ALIAS, hexKey);
        } else {
          inMemoryKey = hexKey;
        }
      } catch {
        inMemoryKey = hexKey;
      }
    } else {
      try {
        await SecureStore.setItemAsync(LOCAL_KEY_ALIAS, hexKey, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } catch (err) {
        console.warn('[encryptedStorage] Falha ao persistir chave no SecureStore:', err);
      }
    }
  }

  const rawBytes = hexToBytes(hexKey);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle não suportado neste ambiente.');
  }

  return await subtle.importKey(
    'raw',
    rawBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Valida os requisitos de integridade para tarefas locais:
 * - Teto de no máximo 10 tarefas
 * - Título entre 2 e 60 caracteres
 */
export function validateLocalTasks(tasks: LocalTask[]): void {
  if (tasks.length > MAX_LOCAL_TASKS) {
    throw new Error(`Limite máximo de ${MAX_LOCAL_TASKS} tarefas locais privadas atingido.`);
  }

  for (const task of tasks) {
    const trimmed = task.title?.trim() ?? '';
    if (trimmed.length < MIN_TITLE_LENGTH || trimmed.length > MAX_TITLE_LENGTH) {
      throw new Error(
        `O título da tarefa deve ter entre ${MIN_TITLE_LENGTH} e ${MAX_TITLE_LENGTH} caracteres.`,
      );
    }
  }
}

/**
 * Cifra e salva a lista de tarefas locais privadas no AsyncStorage sob a chave @ancora_local_tasks_enc.
 * Payload armazenado no formato iv:authTag:ciphertext (AES-GCM com tag de 128 bits).
 */
export async function saveLocalTasks(tasks: LocalTask[]): Promise<void> {
  validateLocalTasks(tasks);

  const cryptoKey = await getOrCreateEncryptionKey();
  const subtle = globalThis.crypto.subtle;

  const iv = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(iv);
  } else {
    for (let i = 0; i < 12; i++) {
      iv[i] = Math.floor(Math.random() * 256);
    }
  }

  const plainText = JSON.stringify(tasks);
  const plainBytes = new TextEncoder().encode(plainText);

  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any, tagLength: 128 },
    cryptoKey,
    plainBytes as unknown as BufferSource,
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  // No WebCrypto AES-GCM, os últimos 16 bytes correspondem à tag de autenticação
  const tagBytes = encryptedArray.slice(encryptedArray.length - 16);
  const ciphertextBytes = encryptedArray.slice(0, encryptedArray.length - 16);

  const payload = `${bytesToHex(iv)}:${bytesToHex(tagBytes)}:${bytesToHex(ciphertextBytes)}`;
  await AsyncStorage.setItem(STORAGE_KEY, payload);
}

/**
 * Lê do AsyncStorage o payload cifrado e decifra com AES-GCM.
 * Retorna array vazio caso nenhuma tarefa esteja cadastrada.
 */
export async function loadLocalTasks(): Promise<LocalTask[]> {
  try {
    const payload = await AsyncStorage.getItem(STORAGE_KEY);
    if (!payload) {
      return [];
    }

    const parts = payload.split(':');
    if (parts.length !== 3) {
      console.warn('[encryptedStorage] Formato de payload inválido, descartando');
      return [];
    }

    const [ivHex, tagHex, cipherHex] = parts;
    if (!ivHex || !tagHex || !cipherHex) {
      console.warn('[encryptedStorage] Formato de payload incompleto, descartando');
      return [];
    }

    const iv = hexToBytes(ivHex);
    const tagBytes = hexToBytes(tagHex);
    const cipherBytes = hexToBytes(cipherHex);

    // Recompõe o buffer ciphertext + tag para decifragem via WebCrypto
    const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
    combined.set(cipherBytes, 0);
    combined.set(tagBytes, cipherBytes.length);

    const cryptoKey = await getOrCreateEncryptionKey();
    const subtle = globalThis.crypto.subtle;

    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any, tagLength: 128 },
      cryptoKey,
      combined as unknown as BufferSource,
    );

    const decodedText = new TextDecoder().decode(decryptedBuffer);
    const tasks = JSON.parse(decodedText) as LocalTask[];
    return Array.isArray(tasks) ? tasks : [];
  } catch (err) {
    console.warn('[encryptedStorage] Falha ao decifrar tarefas locais:', err);
    return [];
  }
}

/**
 * Cria uma nova tarefa privada local com UUID gerado localmente.
 */
export async function addLocalTask(title: string): Promise<LocalTask> {
  const trimmed = title.trim();
  if (trimmed.length < MIN_TITLE_LENGTH || trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(
      `O título deve ter entre ${MIN_TITLE_LENGTH} e ${MAX_TITLE_LENGTH} caracteres.`,
    );
  }

  const currentTasks = await loadLocalTasks();
  if (currentTasks.length >= MAX_LOCAL_TASKS) {
    throw new Error(`Você já atingiu o limite de ${MAX_LOCAL_TASKS} tarefas locais privadas.`);
  }

  const newTask: LocalTask = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title: trimmed,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const updatedTasks = [newTask, ...currentTasks];
  await saveLocalTasks(updatedTasks);
  return newTask;
}

/**
 * Alterna status de conclusão de uma tarefa privada local.
 */
export async function toggleLocalTask(id: string): Promise<LocalTask[]> {
  const currentTasks = await loadLocalTasks();
  const updatedTasks = currentTasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t,
  );
  await saveLocalTasks(updatedTasks);
  return updatedTasks;
}

/**
 * Remove uma tarefa privada local.
 */
export async function deleteLocalTask(id: string): Promise<LocalTask[]> {
  const currentTasks = await loadLocalTasks();
  const updatedTasks = currentTasks.filter((t) => t.id !== id);
  await saveLocalTasks(updatedTasks);
  return updatedTasks;
}

export const LIGHT_DAY_KEY_PREFIX = '@ancora_light_day_';

/**
 * Persiste a preferência diária do modo "Dia Leve" no armazenamento seguro indexado por dateKey.
 */
export async function setLightDayPreference(dateKey: string, isLight: boolean): Promise<void> {
  const key = `${LIGHT_DAY_KEY_PREFIX}${dateKey}`;
  await AsyncStorage.setItem(key, JSON.stringify({ isLight, dateKey }));
}

/**
 * Obtém a preferência diária do modo "Dia Leve" para o dateKey especificado.
 */
export async function getLightDayPreference(dateKey: string): Promise<boolean> {
  try {
    const key = `${LIGHT_DAY_KEY_PREFIX}${dateKey}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.dateKey === dateKey ? Boolean(parsed.isLight) : false;
  } catch {
    return false;
  }
}

export const encryptedStorageService = {
  saveLocalTasks,
  loadLocalTasks,
  addLocalTask,
  toggleLocalTask,
  deleteLocalTask,
  validateLocalTasks,
  setLightDayPreference,
  getLightDayPreference,
};
