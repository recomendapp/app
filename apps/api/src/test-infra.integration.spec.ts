import { eq } from 'drizzle-orm';
import { supportedLanguages, user } from '@libs/db/schemas';
import { createFakeNotifyClient, createTestUser, TestDatabase } from '@libs/testing';

describe('integration test harness', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
  }, 60000);

  afterEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('runs migrations and seeds against the container', async () => {
    const languages = await testDb.db.query.supportedLanguages.findMany({
      where: eq(supportedLanguages.language, 'en-US'),
    });
    expect(languages).toHaveLength(1);
  });

  it('inserts fixtures that satisfy the schema', async () => {
    const { user: createdUser, profile } = await createTestUser(testDb.db);

    expect(createdUser.language).toBe('en-US');
    expect(profile.id).toBe(createdUser.id);
  });

  it('wipes data between tests via snapshot restore', async () => {
    const rows = await testDb.db.select().from(user);
    expect(rows).toHaveLength(0);
  });

  it('exposes a fake NotifyClient that records emitted events', async () => {
    const notify = createFakeNotifyClient();
    await notify.emit('review:liked', {
      actorId: 'actor',
      targetUserId: 'target',
      reviewAuthorId: 'target',
      reviewId: 1,
      mediaId: 1,
      mediaType: 'movie',
    });

    expect(notify.emit).toHaveBeenCalledTimes(1);
  });
});
