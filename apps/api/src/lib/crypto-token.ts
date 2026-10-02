import crypto from 'node:crypto';
import { env } from '../env.js';

export function deriveAccountToken(userId: string): string {
  const pepper = env.APP_PEPPER_V1 || env.APP_PEPPER_SECRET;
  return crypto
    .createHmac('sha256', pepper)
    .update(userId)
    .digest('hex');
}
