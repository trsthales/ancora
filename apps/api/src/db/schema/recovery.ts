import { sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  pgSchema,
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
