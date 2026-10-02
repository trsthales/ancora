import crypto from 'node:crypto';
import { env } from '../env.js';

export function deriveAccountToken(userId: string): string {
  return crypto
    .createHmac('sha256', env.APP_PEPPER_SECRET)
    .update(userId)
    .digest('hex');
}
