import { bigint } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbGender = tmdbSchema.table('gender', {
  id: bigint({ mode: 'number' }).primaryKey(),
});
