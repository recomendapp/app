import {
  bigint,
  index,
  integer,
  real,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';
import { tmdbTvSeriesCredit } from './tv-series';
import { sql } from 'drizzle-orm';
import { tmdbTvSeason } from './tv-season';

export const tmdbTvEpisode = tmdbSchema.table(
  'tv_episode',
  {
    id: bigint({ mode: 'number' }).primaryKey(),
    tvSeasonId: bigint('tv_season_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeason.id, { onDelete: 'cascade' }),
    airDate: timestamp('air_date', { withTimezone: true, mode: 'string' }),
    episodeNumber: integer('episode_number').notNull(),
    episodeType: text('episode_type'),
    name: text(),
    overview: text(),
    productionCode: text('production_code'),
    runtime: integer().default(0),
    stillPath: text('still_path'),
    voteAverage: real('vote_average')
      .default(sql`'0'`)
      .notNull(),
    voteCount: integer('vote_count').default(0).notNull(),
  },
  (table) => [
    unique('unique_tv_episodes').on(table.tvSeasonId, table.episodeNumber),
    index('idx_tmdb_tv_episode_episode_number').on(table.episodeNumber),
    index('idx_tmdb_tv_episode_tv_season_id').on(table.tvSeasonId),
  ],
);

export const tmdbTvEpisodeCredit = tmdbSchema.table(
  'tv_episode_credit',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    creditId: text('credit_id')
      .notNull()
      .references(() => tmdbTvSeriesCredit.id, { onDelete: 'cascade' }),
    tvEpisodeId: bigint('tv_episode_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvEpisode.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_episode_credit').on(table.creditId, table.tvEpisodeId),
    index('idx_tmdb_tv_episode_credit_credit_id').on(table.creditId),
    index('idx_tmdb_tv_episode_credit_tv_episode_id').on(table.tvEpisodeId),
  ],
);
