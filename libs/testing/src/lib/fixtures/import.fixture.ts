import {
  importJob,
  importJobBookmark,
  importJobLogMovie,
  importJobLogMovieWatchedDate,
  importJobLogTvSeries,
  importJobPlaylist,
  importJobPlaylistItem,
  importJobReviewMovie,
  importJobReviewTvSeries,
  importSource,
  provider,
} from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';

export type TestProvider = typeof provider.$inferSelect;
export type TestImportJob = typeof importJob.$inferSelect;
export type TestImportJobLogMovie = typeof importJobLogMovie.$inferSelect;
export type TestImportJobLogMovieWatchedDate = typeof importJobLogMovieWatchedDate.$inferSelect;
export type TestImportJobReviewMovie = typeof importJobReviewMovie.$inferSelect;
export type TestImportJobLogTvSeries = typeof importJobLogTvSeries.$inferSelect;
export type TestImportJobReviewTvSeries = typeof importJobReviewTvSeries.$inferSelect;
export type TestImportJobBookmark = typeof importJobBookmark.$inferSelect;
export type TestImportJobPlaylist = typeof importJobPlaylist.$inferSelect;
export type TestImportJobPlaylistItem = typeof importJobPlaylistItem.$inferSelect;
export type TestImportSource = typeof importSource.$inferSelect;

let providerSuffix = 0;

export async function createTestProvider(
  db: NodePgDatabase<Schema>,
  overrides?: Partial<typeof provider.$inferInsert>,
): Promise<TestProvider> {
  const suffix = providerSuffix++;
  const [row] = await db
    .insert(provider)
    .values({ slug: `test-provider-${suffix}`, name: `Test Provider ${suffix}`, ...overrides })
    .returning();
  return row;
}

export async function createTestImportJob(
  db: NodePgDatabase<Schema>,
  params: { userId: string; providerId?: number },
  overrides?: Partial<typeof importJob.$inferInsert>,
): Promise<TestImportJob> {
  const providerId = params.providerId ?? (await createTestProvider(db)).id;
  const [row] = await db
    .insert(importJob)
    .values({ userId: params.userId, providerId, status: 'awaiting_review', ...overrides })
    .returning();
  return row;
}

export async function createTestImportJobLogMovie(
  db: NodePgDatabase<Schema>,
  params: { importJobId: number; movieId?: number | null },
  overrides?: Partial<typeof importJobLogMovie.$inferInsert>,
): Promise<TestImportJobLogMovie> {
  const [row] = await db
    .insert(importJobLogMovie)
    .values({
      importJobId: params.importJobId,
      rawTitle: 'Test Raw Movie Title',
      movieId: params.movieId ?? null,
      matchStatus: params.movieId ? 'matched' : 'unmatched',
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestImportJobLogMovieWatchedDate(
  db: NodePgDatabase<Schema>,
  params: { importJobLogMovieId: number },
  overrides?: Partial<typeof importJobLogMovieWatchedDate.$inferInsert>,
): Promise<TestImportJobLogMovieWatchedDate> {
  const [row] = await db
    .insert(importJobLogMovieWatchedDate)
    .values({
      importJobLogMovieId: params.importJobLogMovieId,
      watchedDate: '2024-01-15',
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestImportJobReviewMovie(
  db: NodePgDatabase<Schema>,
  params: { importJobLogMovieId: number },
  overrides?: Partial<typeof importJobReviewMovie.$inferInsert>,
): Promise<TestImportJobReviewMovie> {
  const [row] = await db
    .insert(importJobReviewMovie)
    .values({
      importJobLogMovieId: params.importJobLogMovieId,
      body: 'Test imported review body',
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestImportJobLogTvSeries(
  db: NodePgDatabase<Schema>,
  params: { importJobId: number; tvSeriesId?: number | null },
  overrides?: Partial<typeof importJobLogTvSeries.$inferInsert>,
): Promise<TestImportJobLogTvSeries> {
  const [row] = await db
    .insert(importJobLogTvSeries)
    .values({
      importJobId: params.importJobId,
      rawTitle: 'Test Raw TV Series Title',
      tvSeriesId: params.tvSeriesId ?? null,
      matchStatus: params.tvSeriesId ? 'matched' : 'unmatched',
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestImportJobReviewTvSeries(
  db: NodePgDatabase<Schema>,
  params: { importJobLogTvSeriesId: number },
  overrides?: Partial<typeof importJobReviewTvSeries.$inferInsert>,
): Promise<TestImportJobReviewTvSeries> {
  const [row] = await db
    .insert(importJobReviewTvSeries)
    .values({
      importJobLogTvSeriesId: params.importJobLogTvSeriesId,
      body: 'Test imported review body',
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestImportJobBookmark(
  db: NodePgDatabase<Schema>,
  params: { importJobId: number; movieId?: number | null; tvSeriesId?: number | null },
  overrides?: Partial<typeof importJobBookmark.$inferInsert>,
): Promise<TestImportJobBookmark> {
  const type = params.tvSeriesId ? ('tv_series' as const) : ('movie' as const);
  const [row] = await db
    .insert(importJobBookmark)
    .values({
      importJobId: params.importJobId,
      rawTitle: 'Test Raw Bookmark Title',
      type,
      movieId: params.movieId ?? null,
      tvSeriesId: params.tvSeriesId ?? null,
      matchStatus: params.movieId || params.tvSeriesId ? 'matched' : 'unmatched',
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestImportJobPlaylist(
  db: NodePgDatabase<Schema>,
  params: { importJobId: number },
  overrides?: Partial<typeof importJobPlaylist.$inferInsert>,
): Promise<TestImportJobPlaylist> {
  const [row] = await db
    .insert(importJobPlaylist)
    .values({ importJobId: params.importJobId, title: 'Test Imported Playlist', ...overrides })
    .returning();
  return row;
}

export async function createTestImportJobPlaylistItem(
  db: NodePgDatabase<Schema>,
  params: {
    importJobPlaylistId: number;
    movieId?: number | null;
    tvSeriesId?: number | null;
    sourceOrder?: number;
  },
  overrides?: Partial<typeof importJobPlaylistItem.$inferInsert>,
): Promise<TestImportJobPlaylistItem> {
  const type = params.tvSeriesId ? ('tv_series' as const) : ('movie' as const);
  const [row] = await db
    .insert(importJobPlaylistItem)
    .values({
      importJobPlaylistId: params.importJobPlaylistId,
      rawTitle: 'Test Raw Playlist Item Title',
      type,
      movieId: params.movieId ?? null,
      tvSeriesId: params.tvSeriesId ?? null,
      matchStatus: params.movieId || params.tvSeriesId ? 'matched' : 'unmatched',
      sourceOrder: params.sourceOrder ?? 0,
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestImportSource(
  db: NodePgDatabase<Schema>,
  params: { providerId?: number },
  overrides?: Partial<typeof importSource.$inferInsert>,
): Promise<TestImportSource> {
  const providerId = params.providerId ?? (await createTestProvider(db)).id;
  const [row] = await db
    .insert(importSource)
    .values({ providerId, enabled: true, ...overrides })
    .returning();
  return row;
}
