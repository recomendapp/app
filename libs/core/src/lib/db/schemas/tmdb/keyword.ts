import { text, index, bigint } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbKeyword = tmdbSchema.table(
  'keyword',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
  },
  (table) => [index('idx_tmdb_keyword_name').on(table.name)],
);
