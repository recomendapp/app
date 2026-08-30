import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './auth';
import { tmdbMovie, tmdbPerson, tmdbTvSeries } from './tmdb';
import { playlist } from './playlist';

export const pinnedItemTypeEnum = pgEnum('pinned_item_type_enum', [
  'movie',
  'tv_series',
  'playlist',
  'person',
]);

export const pinnedItem = pgTable(
  'pinned_item',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .$onUpdate(() => sql`now()`)
      .notNull(),
    rank: varchar('rank', { length: 255 }).notNull(),
    type: pinnedItemTypeEnum('type').notNull(),
    movieId: bigint('movie_id', { mode: 'number' }).references(() => tmdbMovie.id, {
      onDelete: 'cascade',
    }),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }).references(() => tmdbTvSeries.id, {
      onDelete: 'cascade',
    }),
    playlistId: bigint('playlist_id', { mode: 'number' }).references(() => playlist.id, {
      onDelete: 'cascade',
    }),
    personId: bigint('person_id', { mode: 'number' }).references(() => tmdbPerson.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [
    index('idx_pinned_item_user_id').on(table.userId),
    index('idx_pinned_item_rank').on(table.rank),
    index('idx_pinned_item_type').on(table.type),
    check(
      'check_pinned_item_type_references',
      sql`(
				(type = 'movie'::pinned_item_type_enum AND movie_id IS NOT NULL AND tv_series_id IS NULL AND playlist_id IS NULL AND person_id IS NULL)
				OR
				(type = 'tv_series'::pinned_item_type_enum AND tv_series_id IS NOT NULL AND movie_id IS NULL AND playlist_id IS NULL AND person_id IS NULL)
				OR
				(type = 'playlist'::pinned_item_type_enum AND playlist_id IS NOT NULL AND movie_id IS NULL AND tv_series_id IS NULL AND person_id IS NULL)
				OR
				(type = 'person'::pinned_item_type_enum AND person_id IS NOT NULL AND movie_id IS NULL AND tv_series_id IS NULL AND playlist_id IS NULL)
			)`,
    ),
    uniqueIndex('unique_pinned_item_user_movie')
      .on(table.userId, table.movieId)
      .where(sql`${table.type} = 'movie'::pinned_item_type_enum`),
    uniqueIndex('unique_pinned_item_user_tv_series')
      .on(table.userId, table.tvSeriesId)
      .where(sql`${table.type} = 'tv_series'::pinned_item_type_enum`),
    uniqueIndex('unique_pinned_item_user_playlist')
      .on(table.userId, table.playlistId)
      .where(sql`${table.type} = 'playlist'::pinned_item_type_enum`),
    uniqueIndex('unique_pinned_item_user_person')
      .on(table.userId, table.personId)
      .where(sql`${table.type} = 'person'::pinned_item_type_enum`),
  ],
);

export const pinnedItemRelations = relations(pinnedItem, ({ one }) => ({
  user: one(user, {
    fields: [pinnedItem.userId],
    references: [user.id],
  }),
  movie: one(tmdbMovie, {
    fields: [pinnedItem.movieId],
    references: [tmdbMovie.id],
  }),
  tvSeries: one(tmdbTvSeries, {
    fields: [pinnedItem.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
  playlist: one(playlist, {
    fields: [pinnedItem.playlistId],
    references: [playlist.id],
  }),
  person: one(tmdbPerson, {
    fields: [pinnedItem.personId],
    references: [tmdbPerson.id],
  }),
}));
