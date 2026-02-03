import { char } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbLanguage = tmdbSchema.table('language', {
  iso6391: char('iso_639_1', { length: 2 }).primaryKey(),
});
