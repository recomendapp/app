import { playlist, playlistLike } from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';

export type TestPlaylist = typeof playlist.$inferSelect;
export type TestPlaylistLike = typeof playlistLike.$inferSelect;

export async function createTestPlaylist(
  db: NodePgDatabase<Schema>,
  params: { userId: string },
  overrides?: Partial<typeof playlist.$inferInsert>,
): Promise<TestPlaylist> {
  const [row] = await db
    .insert(playlist)
    .values({ userId: params.userId, title: 'Test Playlist', ...overrides })
    .returning();
  return row;
}

export async function createTestPlaylistLike(
  db: NodePgDatabase<Schema>,
  params: { playlistId: number; userId: string },
): Promise<TestPlaylistLike> {
  const [row] = await db
    .insert(playlistLike)
    .values({ playlistId: params.playlistId, userId: params.userId })
    .returning();
  return row;
}
