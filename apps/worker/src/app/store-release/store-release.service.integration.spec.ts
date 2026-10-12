import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, mock } from 'bun:test';
import { TestDatabase } from '@libs/testing';
import { and, eq } from 'drizzle-orm';
import { versionPolicy } from '@libs/db/schemas';
import { StoreReleaseService } from './store-release.service';

describe('StoreReleaseService', () => {
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

  // `testDb.db` is a new reference after every reset, so the service is built per test.
  let play: { isConfigured: boolean; getLiveProductionVersions: ReturnType<typeof mock> };
  let service: StoreReleaseService;

  function arrange(livePlayVersions: string[]) {
    play = {
      isConfigured: true,
      getLiveProductionVersions: mock().mockResolvedValue(livePlayVersions),
    };
    service = new StoreReleaseService(testDb.db, play as never);
  }

  const read = (platform: 'ios' | 'android', version: string) =>
    testDb.db
      .select()
      .from(versionPolicy)
      .where(and(eq(versionPolicy.platform, platform), eq(versionPolicy.version, version)))
      .then((rows) => rows[0]);

  beforeEach(() => arrange([]));

  it('never reaches Play when the seeded table has no pending row', async () => {
    await service.confirmAndroidReleases();

    expect(play.getLiveProductionVersions).not.toHaveBeenCalled();
  });

  it('flips a pending Android row to live once Play serves that version', async () => {
    await testDb.db
      .insert(versionPolicy)
      .values({ platform: 'android', version: '1.7.0', isBreaking: false });
    arrange(['1.7.0']);

    await service.confirmAndroidReleases();

    expect((await read('android', '1.7.0'))?.state).toBe('live');
  });

  it('leaves a pending row alone while Play still serves an older version', async () => {
    await testDb.db
      .insert(versionPolicy)
      .values({ platform: 'android', version: '1.7.0', isBreaking: false });
    arrange(['1.5.1']);

    await service.confirmAndroidReleases();

    expect((await read('android', '1.7.0'))?.state).toBe('pending');
  });

  // Play version names carry no platform, so a bad `where` here would confirm an iOS
  // release the App Store has not published.
  it('never touches the iOS row at the same version', async () => {
    await testDb.db.insert(versionPolicy).values([
      { platform: 'android', version: '1.7.1', isBreaking: false },
      { platform: 'ios', version: '1.7.1', isBreaking: false },
    ]);
    arrange(['1.7.1']);

    await service.confirmAndroidReleases();

    expect((await read('android', '1.7.1'))?.state).toBe('live');
    expect((await read('ios', '1.7.1'))?.state).toBe('pending');
  });

  // Pushing 1.7.2 while 1.7.1 is still in review. Whichever Play ships is confirmed;
  // the other stays pending, which the API reads as invisible.
  it('confirms only the in-flight version Play actually shipped', async () => {
    await testDb.db.insert(versionPolicy).values([
      { platform: 'android', version: '1.7.1', isBreaking: false },
      { platform: 'android', version: '1.7.2', isBreaking: false },
    ]);
    arrange(['1.7.2']);

    await service.confirmAndroidReleases();

    expect((await read('android', '1.7.1'))?.state).toBe('pending');
    expect((await read('android', '1.7.2'))?.state).toBe('live');
  });

  // `updated_at` is the only record of when a store confirmed a version, and the
  // poller re-reports the live one every hour for the rest of its life.
  it('does not rewrite the already-live row Play keeps reporting', async () => {
    // A pending row is required, or the method returns before Play is consulted and
    // this would pass without exercising the guard at all.
    await testDb.db
      .insert(versionPolicy)
      .values({ platform: 'android', version: '1.7.0', isBreaking: false });
    const before = await read('android', '1.0.0');
    expect(before?.state).toBe('live');
    arrange(['1.0.0', '1.7.0']);

    await service.confirmAndroidReleases();

    expect((await read('android', '1.7.0'))?.state).toBe('live');
    expect((await read('android', '1.0.0'))?.updatedAt).toBe(before?.updatedAt);
  });

  it('never alters isBreaking, which only the release pipeline may set', async () => {
    await testDb.db
      .insert(versionPolicy)
      .values({ platform: 'android', version: '2.0.0', isBreaking: true });
    arrange(['2.0.0']);

    await service.confirmAndroidReleases();

    const row = await read('android', '2.0.0');
    expect(row?.state).toBe('live');
    expect(row?.isBreaking).toBe(true);
  });

  it('writes nothing when Play reports a version that was never recorded', async () => {
    arrange(['9.9.9']);
    await testDb.db
      .insert(versionPolicy)
      .values({ platform: 'android', version: '1.7.0', isBreaking: false });

    await service.confirmAndroidReleases();

    expect((await read('android', '1.7.0'))?.state).toBe('pending');
  });
});
