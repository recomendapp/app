import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { APP_VERSION_RULES } from '@libs/rules';

export const systemSchema = pgSchema('system');

export const systemConfig = systemSchema.table('config', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appPlatformEnum = systemSchema.enum('platform', ['ios', 'android', 'web']);

// One row per (platform, version) ever reported, not one row per platform: a version
// stays `pending` until a background check (see db-sync/store_release_watch) confirms
// it's actually live on the store, since store review can lag the CI publish step by
// hours or days. `minVersion`/`latestVersion` are derived from the `live` rows, not
// stored directly -- see SystemService.
export const versionReleaseStateEnum = systemSchema.enum('version_release_state', [
  'pending',
  'live',
]);

export const versionPolicy = systemSchema.table(
  'version_policy',
  {
    platform: appPlatformEnum().notNull(),
    version: text('version').notNull(),
    // A release-please MAJOR bump: once live, it raises the enforced minVersion.
    isBreaking: boolean('is_breaking').notNull().default(false),
    state: versionReleaseStateEnum().notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.platform, table.version] }),
    check(
      'check_version_policy_version',
      sql`version ~ ${sql.raw(`'${APP_VERSION_RULES.VERSION_PATTERN}'`)}`,
    ),
  ],
);
