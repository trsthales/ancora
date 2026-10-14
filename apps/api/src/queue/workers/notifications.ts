import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { boss } from '../boss.js';

export const COMMUNITY_NOTIFICATION_JOB = 'record_community_notification';

export interface CommunityNotificationJob {
  authorProfileId: string;
  type: 'inspiration' | 'support';
}

export async function processCommunityNotification(job: {
  data: CommunityNotificationJob;
}): Promise<void> {
  const { authorProfileId, type } = job.data;
  if (!authorProfileId || !type) return;

  const isSupport = type === 'support';

  await db.execute(sql`
    INSERT INTO recovery_core.profile_notification_counters (
      profile_id,
      unread_supports,
      unread_inspirations,
      updated_at
    )
    VALUES (
      ${authorProfileId},
      ${isSupport ? 1 : 0},
      ${isSupport ? 0 : 1},
      NOW()
    )
    ON CONFLICT (profile_id)
    DO UPDATE SET
      unread_supports = profile_notification_counters.unread_supports + ${isSupport ? 1 : 0},
      unread_inspirations = profile_notification_counters.unread_inspirations + ${isSupport ? 0 : 1},
      updated_at = NOW();
  `);
}

export async function registerNotificationWorker(): Promise<string> {
  return boss.work<CommunityNotificationJob>(COMMUNITY_NOTIFICATION_JOB, async (jobs) => {
    for (const job of jobs) {
      await processCommunityNotification(job);
    }
  });
}
