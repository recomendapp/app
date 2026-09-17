import { tmdbMovie } from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';

export type TestMovie = typeof tmdbMovie.$inferSelect;

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

export async function createTestMovie(
  db: NodePgDatabase<Schema>,
  overrides?: Partial<typeof tmdbMovie.$inferInsert>,
): Promise<TestMovie> {
  const [movie] = await db
    .insert(tmdbMovie)
    .values({ id: randomTmdbId(), ...overrides })
    .returning();
  return movie;
}
