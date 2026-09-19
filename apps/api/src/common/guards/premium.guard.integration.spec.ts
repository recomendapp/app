import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profile } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../app/auth/auth.service';
import { PremiumGuard } from './premium.guard';

describe('PremiumGuard', () => {
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

  const asUser = (row: { id: string }) => row as unknown as User;
  const guard = () => new PremiumGuard(testDb.db);

  function contextFor(user: User | null): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('throws ForbiddenException when there is no authenticated user', async () => {
    await expect(guard().canActivate(contextFor(null))).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the user is not premium', async () => {
    const { user } = await createTestUser(testDb.db, { profile: { isPremium: false } });

    await expect(guard().canActivate(contextFor(asUser(user)))).rejects.toThrow(ForbiddenException);
  });

  it('allows the request when the user is premium', async () => {
    const { user } = await createTestUser(testDb.db, { profile: { isPremium: true } });

    const result = await guard().canActivate(contextFor(asUser(user)));

    expect(result).toBe(true);
  });

  it('throws ForbiddenException when the user profile row does not exist at all', async () => {
    const { user } = await createTestUser(testDb.db);
    await testDb.db.delete(profile).where(eq(profile.id, user.id));

    await expect(guard().canActivate(contextFor(asUser(user)))).rejects.toThrow(ForbiddenException);
  });
});
