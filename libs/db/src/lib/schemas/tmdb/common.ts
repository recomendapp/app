import { bigint, date, index, pgSchema, timestamp } from 'drizzle-orm/pg-core';

export const tmdbSchema = pgSchema('tmdb');

export const imageType = tmdbSchema.enum('image_type', [
  'backdrop',
  'poster',
  'logo',
  'profile',
]);

export const syncLogType = tmdbSchema.enum('sync_log_type', [
  'movie',
  'person',
  'collection',
  'keyword',
  'company',
  'language',
  'country',
  'genre',
  'network',
  'tv_serie',
]);

export const syncLogStatus = tmdbSchema.enum('sync_log_status', [
  'initialized',
  'fetching_data',
  'data_fetched',
  'syncing_to_db',
  'updating_popularity',
  'success',
  'failed',
]);

export const syncLogs = tmdbSchema.table('sync_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  type: syncLogType('type').notNull(),
  status: syncLogStatus('status').default('initialized').notNull(),
  date: date('date', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_sync_logs_type').on(table.type),
  index('idx_sync_logs_status').on(table.status),
  index('idx_sync_logs_date').on(table.date),
]);
