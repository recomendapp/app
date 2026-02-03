import { bigint, index, integer, real, text } from 'drizzle-orm/pg-core';
import { imageType, tmdbSchema } from './common';

export const tmdbCollection = tmdbSchema.table('collection', {
  id: bigint({ mode: 'number' }).primaryKey(),
  name: text(),
});

export const tmdbCollectionImage = tmdbSchema.table(
  'collection_image',
  {
    id: bigint({ mode: 'number' }),
    collectionId: bigint({ mode: 'number' })
      .notNull()
      .references(() => tmdbCollection.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
    type: imageType().notNull(),
    aspectRatio: real('aspect_ratio'),
    height: integer(),
    width: integer(),
    voteAverage: real('vote_average'),
    voteCount: integer('vote_count'),
    iso6391: text('iso_639_1'),
  },
  (table) => [
    index('idx_tmdb_collection_image_collection_id').on(table.collectionId),
    index('idx_tmdb_collection_image_iso_language').on(table.iso6391),
    index('idx_tmdb_collection_image_type').on(table.type),
    index('idx_tmdb_collection_image_vote_average').on(table.voteAverage),
  ],
);

export const tmdbCollectionTranslation = tmdbSchema.table(
  'collection_translation',
  {
    id: bigint({ mode: 'number' }),
    collection_id: bigint({ mode: 'number' })
      .notNull()
      .references(() => tmdbCollection.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1').notNull(),
    overview: text(),
    title: text(),
    iso31661: text('iso_3166_1').notNull(),
    homepage: text(),
  },
  (table) => [
    index('idx_tmdb_collection_translation_collection_id').on(
      table.collection_id,
    ),
    index('idx_tmdb_collection_translation_collection_language').on(
      table.collection_id,
      table.iso6391,
      table.iso31661,
    ),
    index('idx_tmdb_collection_translation_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_collection_translation_iso_639_1').on(table.iso6391),
  ],
);
