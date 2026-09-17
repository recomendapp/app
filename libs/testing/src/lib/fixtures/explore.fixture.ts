import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { explore, exploreItem } from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';

export type TestExplore = typeof explore.$inferSelect;
export type TestExploreItem = typeof exploreItem.$inferSelect;

export async function createTestExplore(
  db: NodePgDatabase<Schema>,
  overrides?: Partial<typeof explore.$inferInsert>,
): Promise<TestExplore> {
  const suffix = randomUUID().slice(0, 8);
  const [row] = await db
    .insert(explore)
    .values({
      name: `Test Explore ${suffix}`,
      slug: `test-explore-${suffix}`,
      ...overrides,
    })
    .returning();
  return row;
}

export async function createTestExploreItem(
  db: NodePgDatabase<Schema>,
  params: {
    exploreId: number;
    movieId?: number;
    tvSeriesId?: number;
    lat?: number;
    lng?: number;
  },
): Promise<TestExploreItem> {
  const type = params.movieId ? ('movie' as const) : ('tv_series' as const);
  const lat = params.lat ?? 48.8566;
  const lng = params.lng ?? 2.3522;

  const [row] = await db
    .insert(exploreItem)
    .values({
      exploreId: params.exploreId,
      type,
      movieId: params.movieId ?? null,
      tvSeriesId: params.tvSeriesId ?? null,
      // Matches the seed script: inserting a plain `{x, y}` object into a
      // PostGIS geometry column doesn't reliably round-trip through the
      // driver, so build the point with a raw SQL call instead.
      // PostGIS lives in the `extensions` schema (see the
      // 0052_enable_postgis_extension migration); qualify explicitly since
      // the test pool's search_path isn't guaranteed to include it.
      location: sql`extensions.ST_SetSRID(extensions.ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)`,
    })
    .returning();
  return row;
}
