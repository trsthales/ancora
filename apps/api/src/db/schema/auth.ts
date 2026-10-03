import { boolean, pgSchema, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth_security');

export const users = authSchema.table(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    loginToken: varchar('login_token', { length: 64 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    recoveryKeyHash: varchar('recovery_key_hash', { length: 64 }).notNull(),
    isAdult: boolean('is_adult').notNull().default(false),
    role: varchar('role', { length: 50 }).notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('idx_users_login_token').on(table.loginToken)],
);

export const sessions = authSchema.table('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  rotatedToSessionId: uuid('rotated_to_session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const consents = authSchema.table('consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  termsVersion: varchar('terms_version', { length: 20 }).notNull(),
  privacyPolicyVersion: varchar('privacy_policy_version', { length: 20 }).notNull(),
  healthDataConsent: boolean('health_data_consent').notNull().default(true),
  consentedAt: timestamp('consented_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

