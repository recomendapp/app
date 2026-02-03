import { text } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbCountry = tmdbSchema.table('country', {
  iso31661: text('iso_3166_1').primaryKey(),
});
