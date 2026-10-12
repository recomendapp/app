import { describe, it, expect, mock } from 'bun:test';
import { StoreReleaseService } from './store-release.service';

describe('StoreReleaseService', () => {
  function createService({
    pending = [] as string[],
    livePlayVersions = [] as string[],
    isConfigured = true,
  } = {}) {
    // Stands in for the real `WHERE state = 'pending' AND version IN (...)`: only the
    // pending versions Play actually serves come back from `returning`.
    const confirmed = pending.filter((version) => livePlayVersions.includes(version));
    const updateWhere = mock().mockImplementation(() => ({
      returning: mock().mockResolvedValue(confirmed.map((version) => ({ version }))),
    }));
    const db = {
      select: mock().mockReturnValue({
        from: mock().mockReturnValue({
          where: mock().mockResolvedValue(pending.map((version) => ({ version }))),
        }),
      }),
      update: mock().mockReturnValue({
        set: mock().mockReturnValue({ where: updateWhere }),
      }),
    };
    const googlePlay = {
      isConfigured,
      getLiveProductionVersions: mock().mockResolvedValue(livePlayVersions),
    };
    const service = new StoreReleaseService(db as any, googlePlay as any);
    const logs: string[] = [];
    (service as any).logger = { log: (m: string) => logs.push(m), warn: mock(), error: mock() };
    return { service, db, googlePlay, logs };
  }

  it('never calls Google when no Android version is pending', async () => {
    const { service, db, googlePlay } = createService({ pending: [] });

    await service.confirmAndroidReleases();

    expect(googlePlay.getLiveProductionVersions).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('does not write when the pending version is not live on Play yet', async () => {
    const { service, db } = createService({
      pending: ['1.7.1'],
      livePlayVersions: ['1.7.0'],
    });

    await service.confirmAndroidReleases();

    expect(db.update).not.toHaveBeenCalled();
  });

  it('confirms the pending version once Play serves it', async () => {
    const { service, db } = createService({
      pending: ['1.7.1'],
      livePlayVersions: ['1.7.1'],
    });

    await service.confirmAndroidReleases();

    expect(db.update).toHaveBeenCalledTimes(1);
  });

  // Pushing 1.7.2 while 1.7.1 is still in review: whichever Play actually ships gets
  // confirmed, and the other simply stays pending -- invisible to clients, since the
  // API derives its policy from `live` rows only.
  it('confirms only the in-flight versions Play reports as live', async () => {
    const { service, db, logs } = createService({
      pending: ['1.7.1', '1.7.2'],
      livePlayVersions: ['1.7.2'],
    });

    await service.confirmAndroidReleases();

    expect(db.update).toHaveBeenCalledTimes(1);
    expect(logs.join('\n')).toContain('Confirmed live on Play: 1.7.2');
    expect(logs.join('\n')).not.toContain('1.7.1');
  });

  it('stays quiet and makes no call when the credentials are not provisioned', async () => {
    const { service, db, googlePlay } = createService({
      pending: ['1.7.1'],
      isConfigured: false,
    });

    await service.confirmAndroidReleases();

    expect(db.select).not.toHaveBeenCalled();
    expect(googlePlay.getLiveProductionVersions).not.toHaveBeenCalled();
  });

  it('swallows a Play failure so one bad hour does not crash the worker', async () => {
    const { service, googlePlay } = createService({
      pending: ['1.7.1'],
      livePlayVersions: [],
    });
    googlePlay.getLiveProductionVersions = mock().mockRejectedValue(new Error('503'));

    await expect(service.confirmAndroidReleases()).resolves.toBeUndefined();
  });
});
