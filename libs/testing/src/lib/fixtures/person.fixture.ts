import { tmdbPerson } from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';

export type TestPerson = typeof tmdbPerson.$inferSelect;

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

export async function createTestPerson(
  db: NodePgDatabase<Schema>,
  overrides?: Partial<typeof tmdbPerson.$inferInsert>,
): Promise<TestPerson> {
  const [person] = await db
    .insert(tmdbPerson)
    .values({ id: randomTmdbId(), name: 'Test Person', ...overrides })
    .returning();
  return person;
}
