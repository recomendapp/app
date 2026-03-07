import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgMaterializedView,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { tmdbMovie, tmdbTvSeries } from './tmdb';
import { user } from './auth';

export const recoStatusEnum = pgEnum('reco_status', [
  'active',
  'completed',
  'deleted',
]);
export const recoTypeEnum = pgEnum('reco_type', ['movie', 'tv_series']);

export const reco = pgTable(
  'reco',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    status: recoStatusEnum().default('active').notNull(),
    comment: text(),
    // Type & References
    type: recoTypeEnum('type').notNull(),
    movieId: bigint('movie_id', { mode: 'number' })
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_reco_user_id').on(table.userId),
    index('idx_reco_sender_id').on(table.senderId),
    index('idx_reco_status').on(table.status),
    check('check_user_reco_comment', sql`length(comment) <= 180`),
    check(
      'check_reco_type_references',
      sql`(
        (type = 'movie'::reco_type AND movie_id IS NOT NULL AND tv_series_id IS NULL)
        OR
        (type = 'tv_series'::reco_type AND tv_series_id IS NOT NULL AND movie_id IS NULL)
      )`,
    ),
    uniqueIndex('unique_reco_movie')
      .on(table.userId, table.senderId, table.movieId)
      .where(sql`${table.type} = 'movie'::reco_type`),

    uniqueIndex('unique_reco_tv_series')
      .on(table.userId, table.senderId, table.tvSeriesId)
      .where(sql`${table.type} = 'tv_series'::reco_type`),
  ]
);
export const recoRelations = relations(reco, ({ one }) => ({
  user: one(user, {
    fields: [reco.userId],
    references: [user.id],
  }),
  sender: one(user, {
    fields: [reco.senderId],
    references: [user.id],
  }),
  movie: one(tmdbMovie, {
    fields: [reco.movieId],
    references: [tmdbMovie.id],
  }),
  tvSeries: one(tmdbTvSeries, {
    fields: [reco.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
}));

export const recosTrending = pgMaterializedView('recos_trending').as((qb) => {
  return qb
    .select({
      mediaId: sql<number>`COALESCE(${reco.movieId}, ${reco.tvSeriesId})`.as('media_id'),
      type: reco.type,
      recommendationCount: sql<number>`cast(count(*) as int)`.as('recommendation_count'),
    })
    .from(reco)
    .where(sql`${reco.createdAt} > (now() - '30 days'::interval)`)
    .groupBy(sql`COALESCE(${reco.movieId}, ${reco.tvSeriesId})`, reco.type);
});