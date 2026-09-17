import { randomUUID } from 'node:crypto';
import { session } from '@libs/db/schemas';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '../db/test-database';

export type TestSession = typeof session.$inferSelect;

export async function createTestSession(
  db: NodePgDatabase<Schema>,
  params: { userId: string },
  overrides?: Partial<typeof session.$inferInsert>,
): Promise<TestSession> {
  const suffix = randomUUID();
  const [row] = await db
    .insert(session)
    .values({
      id: suffix,
      userId: params.userId,
      token: `test-token-${suffix}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    })
    .returning();
  return row;
}
