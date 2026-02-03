import { bigint, index, integer, real, text } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbNetwork = tmdbSchema.table('network', {
  id: bigint({ mode: 'number' }).primaryKey(),
  name: text().notNull(),
  headquarters: text(),
  homepage: text(),
  originCountry: text('origin_country'),
});

export const tmdbNetworkImage = tmdbSchema.table(
  'network_image',
  {
    id: text().primaryKey(),
    networkId: bigint({ mode: 'number' })
      .notNull()
      .references(() => tmdbNetwork.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
    fileType: text('file_type').notNull(),
    aspectRatio: real('aspect_ratio'),
    height: integer(),
    width: integer(),
    voteAverage: real('vote_average'),
    voteCount: integer('vote_count'),
  },
  (table) => [
    index('idx_tmdb_network_image_network_id').on(table.networkId),
    index('idx_tmdb_network_image_vote_average').on(table.voteAverage),
  ],
);

export const tmdbNetworkAlternativeName = tmdbSchema.table(
  'network_alternative_name',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    networkId: bigint({ mode: 'number' })
      .notNull()
      .references(() => tmdbNetwork.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    type: text(),
  },
  (table) => [
    index('idx_tmdb_network_alternative_name_network_id').on(table.networkId),
  ],
);
