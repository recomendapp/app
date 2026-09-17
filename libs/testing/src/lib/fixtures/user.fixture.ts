import { randomUUID } from 'node:crypto';
import { profile, user } from '@libs/db/schemas';
import type { Schema } from '../db/test-database';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type TestUser = typeof user.$inferSelect;
export type TestProfile = typeof profile.$inferSelect;

export async function createTestUser(
  db: NodePgDatabase<Schema>,
  overrides?: {
    user?: Partial<typeof user.$inferInsert>;
    profile?: Partial<typeof profile.$inferInsert>;
  },
): Promise<{ user: TestUser; profile: TestProfile }> {
  const id = overrides?.user?.id ?? randomUUID();
  const suffix = id.slice(0, 8);

  const [createdUser] = await db
    .insert(user)
    .values({
      id,
      name: `Test User ${suffix}`,
      email: `test-${suffix}@example.com`,
      username: `test_${suffix}`,
      ...overrides?.user,
    })
    .returning();

  const [createdProfile] = await db
    .insert(profile)
    .values({
      id: createdUser.id,
      ...overrides?.profile,
    })
    .returning();

  return { user: createdUser, profile: createdProfile };
}
