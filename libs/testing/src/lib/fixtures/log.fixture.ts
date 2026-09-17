import { logMovie, logTvSeries } from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';
import { createTestMovie } from './movie.fixture';
import { createTestTvSeries } from './tv-series.fixture';

export type TestLogMovie = typeof logMovie.$inferSelect;
export type TestLogTvSeries = typeof logTvSeries.$inferSelect;

export async function createTestLogMovie(
  db: NodePgDatabase<Schema>,
  params: { userId: string; movieId?: number },
  overrides?: Partial<typeof logMovie.$inferInsert>,
): Promise<TestLogMovie> {
  const movieId = params.movieId ?? (await createTestMovie(db)).id;
  const [log] = await db
    .insert(logMovie)
    .values({ userId: params.userId, movieId, ...overrides })
    .returning();
  return log;
}

export async function createTestLogTvSeries(
  db: NodePgDatabase<Schema>,
  params: { userId: string; tvSeriesId?: number },
  overrides?: Partial<typeof logTvSeries.$inferInsert>,
): Promise<TestLogTvSeries> {
  const tvSeriesId = params.tvSeriesId ?? (await createTestTvSeries(db)).id;
  const [log] = await db
    .insert(logTvSeries)
    .values({ userId: params.userId, tvSeriesId, ...overrides })
    .returning();
  return log;
}
