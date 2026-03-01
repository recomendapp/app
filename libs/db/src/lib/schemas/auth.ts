import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  pgSchema,
  uuid,
} from 'drizzle-orm/pg-core';
import { profile } from './user';
import { supportedLanguages } from './i18n';

export const authSchema = pgSchema('auth');

export const user = authSchema.table('user', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => sql`now()`)
    .notNull(),
  username: text('username').unique().notNull(),
  displayUsername: text('display_username'),
  usernameUpdatedAt: timestamp('username_updated_at', { withTimezone: true, mode: 'string' }),
  language: text('language')
    .default('en-US')
    .notNull()
    .references(() => supportedLanguages.language, { 
      onUpdate: 'cascade', 
      onDelete: 'restrict',
    }),
});

export const session = authSchema.table(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const account = authSchema.table(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'string' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verification = authSchema.table(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => sql`now()`)
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(profile, {
    fields: [user.id],
    references: [profile.id],
  }),
  language: one(supportedLanguages, {
    fields: [user.language],
    references: [supportedLanguages.language],
  })
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
