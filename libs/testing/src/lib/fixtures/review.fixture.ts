import {
  reviewMovie,
  reviewMovieComment,
  reviewMovieLike,
  reviewTvSeries,
  reviewTvSeriesComment,
  reviewTvSeriesLike,
} from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';
import {
  createTestLogMovie,
  createTestLogTvSeries,
  TestLogMovie,
  TestLogTvSeries,
} from './log.fixture';

export type TestReviewMovie = typeof reviewMovie.$inferSelect;
export type TestReviewTvSeries = typeof reviewTvSeries.$inferSelect;
export type TestReviewMovieComment = typeof reviewMovieComment.$inferSelect;
export type TestReviewTvSeriesComment = typeof reviewTvSeriesComment.$inferSelect;
export type TestReviewMovieLike = typeof reviewMovieLike.$inferSelect;
export type TestReviewTvSeriesLike = typeof reviewTvSeriesLike.$inferSelect;

/**
 * Inserts a log + a review on top of it (a review is 1:1 with its log —
 * `reviewMovie.id` IS `logMovie.id`, not its own identity column).
 */
export async function createTestReviewMovie(
  db: NodePgDatabase<Schema>,
  params: { userId: string; movieId?: number },
  overrides?: Partial<typeof reviewMovie.$inferInsert>,
): Promise<{ log: TestLogMovie; review: TestReviewMovie }> {
  const log = await createTestLogMovie(db, params);
  const [review] = await db
    .insert(reviewMovie)
    .values({ id: log.id, body: 'Test review body', ...overrides })
    .returning();
  return { log, review };
}

export async function createTestReviewTvSeries(
  db: NodePgDatabase<Schema>,
  params: { userId: string; tvSeriesId?: number },
  overrides?: Partial<typeof reviewTvSeries.$inferInsert>,
): Promise<{ log: TestLogTvSeries; review: TestReviewTvSeries }> {
  const log = await createTestLogTvSeries(db, params);
  const [review] = await db
    .insert(reviewTvSeries)
    .values({ id: log.id, body: 'Test review body', ...overrides })
    .returning();
  return { log, review };
}

export async function createTestReviewMovieComment(
  db: NodePgDatabase<Schema>,
  params: { reviewId: number; userId: string; parentId?: number | null },
  overrides?: Partial<typeof reviewMovieComment.$inferInsert>,
): Promise<TestReviewMovieComment> {
  const [comment] = await db
    .insert(reviewMovieComment)
    .values({
      reviewId: params.reviewId,
      userId: params.userId,
      parentId: params.parentId ?? null,
      body: 'Test comment body',
      ...overrides,
    })
    .returning();
  return comment;
}

export async function createTestReviewTvSeriesComment(
  db: NodePgDatabase<Schema>,
  params: { reviewId: number; userId: string; parentId?: number | null },
  overrides?: Partial<typeof reviewTvSeriesComment.$inferInsert>,
): Promise<TestReviewTvSeriesComment> {
  const [comment] = await db
    .insert(reviewTvSeriesComment)
    .values({
      reviewId: params.reviewId,
      userId: params.userId,
      parentId: params.parentId ?? null,
      body: 'Test comment body',
      ...overrides,
    })
    .returning();
  return comment;
}

export async function createTestReviewMovieLike(
  db: NodePgDatabase<Schema>,
  params: { reviewId: number; userId: string },
): Promise<TestReviewMovieLike> {
  const [like] = await db
    .insert(reviewMovieLike)
    .values({ reviewId: params.reviewId, userId: params.userId })
    .returning();
  return like;
}

export async function createTestReviewTvSeriesLike(
  db: NodePgDatabase<Schema>,
  params: { reviewId: number; userId: string },
): Promise<TestReviewTvSeriesLike> {
  const [like] = await db
    .insert(reviewTvSeriesLike)
    .values({ reviewId: params.reviewId, userId: params.userId })
    .returning();
  return like;
}
