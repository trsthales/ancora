import { sql } from 'drizzle-orm';
import { index, integer, pgSchema, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

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

export const quarantinedPseudonyms = recoverySchema.table('quarantined_pseudonyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  pseudonym: varchar('pseudonym', { length: 50 }).notNull().unique(),
  quarantinedUntil: timestamp('quarantined_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

