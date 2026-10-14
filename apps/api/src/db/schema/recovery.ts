import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgSchema,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const recoverySchema = pgSchema('recovery_core');

export const profiles = recoverySchema.table(
  'profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountToken: varchar('account_token', { length: 64 }).notNull().unique(),
    pseudonym: varchar('pseudonym', { length: 50 }).notNull().unique(),
    avatarId: varchar('avatar_id', { length: 50 }).notNull().default('avatar_default'),
    persona: varchar('persona', { length: 20 }).notNull(),
    reactionSalt: varchar('reaction_salt', { length: 64 })
      .notNull()
      .default(sql`gen_random_uuid()`),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [
    index('idx_profiles_account_token').on(table.accountToken),
    index('idx_profiles_last_seen').on(table.lastSeenAt),
  ],
);

export const checkins = recoverySchema.table(
  'checkins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    cravingLevel: integer('craving_level').notNull(),
    mood: varchar('mood', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_checkins_profile_created').on(table.profileId, table.createdAt)],
);

export const quarantinedPseudonyms = recoverySchema.table(
  'quarantined_pseudonyms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountToken: varchar('account_token', { length: 64 }),
    pseudonym: varchar('pseudonym', { length: 50 }).notNull().unique(),
    quarantinedUntil: timestamp('quarantined_until', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_quarantined_account_token').on(table.accountToken),
  ],
);

export const habits = recoverySchema.table(
  'habits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    chipId: varchar('chip_id', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [uniqueIndex('idx_habits_profile_chip').on(table.profileId, table.chipId)],
);

export const habitLogs = recoverySchema.table(
  'habit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    dateKey: date('date_key').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true })
      .default(sql`date_trunc('hour', now())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('idx_habit_logs_unique_day').on(table.habitId, table.dateKey),
    index('idx_habit_logs_profile_date').on(table.profileId, table.dateKey),
  ],
);

export const triadPosts = recoverySchema.table(
  'triad_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 10 }).notNull(), // 'FACO' | 'EVITO' | 'ME_AJUDA'
    chipIds: varchar('chip_ids', { length: 32 }).array().notNull(),
    isAnonymous: boolean('is_anonymous').notNull().default(false),
    isHidden: boolean('is_hidden').notNull().default(false), // Kill-switch administrativo
    savedCount: integer('saved_count').notNull().default(0),
    supportCount: integer('support_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_triad_posts_created').on(table.createdAt),
    index('idx_triad_posts_category').on(table.category, table.createdAt),
  ],
);

export const dailyPostLimits = recoverySchema.table(
  'daily_post_limits',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    postDate: date('post_date').notNull(),
    postCount: integer('post_count').notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.postDate] })],
);

export const myTools = recoverySchema.table(
  'my_tools',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    chipId: varchar('chip_id', { length: 32 }).notNull(),
    category: varchar('category', { length: 20 }).notNull(),
    savedAt: timestamp('saved_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [uniqueIndex('idx_my_tools_profile_chip').on(table.profileId, table.chipId)],
);

export const postSaves = recoverySchema.table(
  'post_saves',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => triadPosts.id, { onDelete: 'cascade' }),
    saveToken: varchar('save_token', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.saveToken] })],
);

export const postSupports = recoverySchema.table(
  'post_supports',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => triadPosts.id, { onDelete: 'cascade' }),
    reactionToken: varchar('reaction_token', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.reactionToken] })],
);

export const profileNotificationCounters = recoverySchema.table(
  'profile_notification_counters',
  {
    profileId: uuid('profile_id')
      .notNull()
      .primaryKey()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    unreadSupports: integer('unread_supports').notNull().default(0),
    unreadInspirations: integer('unread_inspirations').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

export const dailyMetrics = recoverySchema.table(
  'daily_metrics',
  {
    metricDate: date('metric_date').notNull(),
    metricName: varchar('metric_name', { length: 50 }).notNull(),
    metricValue: integer('metric_value').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.metricDate, table.metricName] })],
);
