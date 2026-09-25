import { ForbiddenException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profile } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import { assertPremium } from './assert-premium';

describe('assertPremium', () => {
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

  it('throws ForbiddenException when the user is not premium', async () => {
    const { user } = await createTestUser(testDb.db);

    await expect(assertPremium(testDb.db, user.id)).rejects.toThrow(ForbiddenException);
  });

  it('resolves when the user is premium', async () => {
    const { user } = await createTestUser(testDb.db);
    await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, user.id));

    await expect(assertPremium(testDb.db, user.id)).resolves.toBeUndefined();
  });
});
