import { eq, sql } from 'drizzle-orm';
import { playlist } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { buildJsonbObject } from './sql';

describe('buildJsonbObject', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
  });

  afterEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('builds a jsonb object from plain table columns', async () => {
    const { user } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: user.id }, { title: 'My Playlist' });

    const [row] = await testDb.db
      .select({
        obj: sql<{
          id: number;
          title: string;
        }>`${buildJsonbObject({ id: playlist.id, title: playlist.title })}`,
      })
      .from(playlist)
      .where(eq(playlist.id, p.id));

    expect(row.obj).toEqual({ id: p.id, title: 'My Playlist' });
  });

  it('includes computed SQL-tagged fragments (e.g. a CASE expression), not just plain columns', async () => {
    const { user } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: user.id }, { visibility: 'public' });
    const isPublic = sql<boolean>`${playlist.visibility} = 'public'`;

    const [row] = await testDb.db
      .select({
        obj: sql<{
          id: number;
          isPublic: boolean;
        }>`${buildJsonbObject({ id: playlist.id, isPublic })}`,
      })
      .from(playlist)
      .where(eq(playlist.id, p.id));

    expect(row.obj).toEqual({ id: p.id, isPublic: true });
  });

  it('silently drops non-column, non-SQL values (e.g. a plain string) instead of erroring', async () => {
    const { user } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: user.id });

    const [row] = await testDb.db
      .select({
        obj: sql<Record<string, unknown>>`${buildJsonbObject({
          id: playlist.id,
          // Not a Column and not an SQL fragment - must be filtered out, not passed to jsonb_build_object as-is.
          notAColumn: 'plain-string' as unknown as typeof playlist.id,
        })}`,
      })
      .from(playlist)
      .where(eq(playlist.id, p.id));

    expect(row.obj).toEqual({ id: p.id });
    expect(row.obj).not.toHaveProperty('notAColumn');
  });

  it('returns an empty jsonb object when given no valid entries', async () => {
    const result = await testDb.db.execute<{ obj: Record<string, unknown> }>(
      sql`SELECT ${buildJsonbObject({ notAColumn: 'nope' as unknown as typeof playlist.id })} as obj`,
    );

    expect(result.rows[0].obj).toEqual({});
  });
});
