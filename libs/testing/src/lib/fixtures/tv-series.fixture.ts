import { tmdbTvSeries } from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';

export type TestTvSeries = typeof tmdbTvSeries.$inferSelect;

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

export async function createTestTvSeries(
  db: NodePgDatabase<Schema>,
  overrides?: Partial<typeof tmdbTvSeries.$inferInsert>,
): Promise<TestTvSeries> {
  const [tvSeries] = await db
    .insert(tmdbTvSeries)
    .values({ id: randomTmdbId(), ...overrides })
    .returning();
  return tvSeries;
}
