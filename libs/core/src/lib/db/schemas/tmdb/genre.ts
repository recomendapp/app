import { bigint, primaryKey, text } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbGenre = tmdbSchema.table('genre', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
});

export const tmdbGenreTranslation = tmdbSchema.table(
  'genre_translation',
  {
    genreId: bigint({ mode: 'number' })
      .notNull()
      .references(() => tmdbGenre.id, { onDelete: 'cascade' }),
    language: text().notNull(),
    name: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.genreId, table.language] })],
);
