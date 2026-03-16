import {
  pgTable,
  bigint,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const feedTypeEnum = pgEnum('feed_type', [
  'log_movie',
  'log_tv_series',
  'playlist_like',
  'review_movie_like',
  'review_tv_series_like'
]);

export const feed = pgTable(
  'feed',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),      
    activityType: feedTypeEnum('activity_type').notNull(),     
    activityId: bigint('activity_id', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('idx_feed_user_id_created_at_desc').on(table.userId, table.createdAt.desc()),
    uniqueIndex('idx_feed_activity_type_activity_id').on(
      table.activityType,
      table.activityId
    ),
  ]
);