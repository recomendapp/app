import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'bun:test';
import { createTestTvSeries, TestDatabase } from '@libs/testing';
import { tmdbTvSeriesTranslation } from '@libs/db/schemas';
import type { CacheService } from '../../../common/modules/cache/cache.service';
import { TvSeriesMetadataService } from './tv-series-metadata.service';

class FakeCacheService {
  private readonly store = new Map<string, unknown>();
  setCallCount = 0;
  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null;
  }
  async set(key: string, value: unknown): Promise<void> {
    this.setCallCount++;
    this.store.set(key, value);
  }
  async del(key: string | string[]): Promise<void> {
    for (const k of Array.isArray(key) ? key : [key]) this.store.delete(k);
  }
}

describe('TvSeriesMetadataService', () => {
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

  let cache: FakeCacheService;
  let service: TvSeriesMetadataService;

  beforeEach(() => {
    cache = new FakeCacheService();
    service = new TvSeriesMetadataService(testDb.db, cache as unknown as CacheService);
  });

  const addTranslation = (
    tvSeriesId: number,
    locale: string,
    fields: { name?: string | null; overview?: string | null },
  ) => {
    const [iso6391, iso31661] = locale.split('-');
    return testDb.db
      .insert(tmdbTvSeriesTranslation)
      .values({ tvSeriesId, iso6391, iso31661, ...fields });
  };

  it('returns nothing for a series with no translation rows', async () => {
    const series = await createTestTvSeries(testDb.db);

    expect((await service.get(series.id)).alternates).toEqual([]);
  });

  it('gives each locale the path built from its own name', async () => {
    const series = await createTestTvSeries(testDb.db, { originalName: 'The Show' });
    await addTranslation(series.id, 'en-US', { name: '', overview: 'An overview.' });
    await addTranslation(series.id, 'fr-FR', { name: 'La Serie', overview: 'Un resume.' });

    const { alternates } = await service.get(series.id);
    const paths = Object.fromEntries(alternates.map((a) => [a.locale, a.path]));

    expect(paths['fr-FR']).toBe(`/tv-series/${series.id}-la-serie`);
    // Empty name means "same as the original", so it falls back rather than being dropped.
    expect(paths['en-US']).toBe(`/tv-series/${series.id}-the-show`);
  });

  it('excludes a locale that has a name but no overview', async () => {
    const series = await createTestTvSeries(testDb.db);
    await addTranslation(series.id, 'fa-IR', { name: 'Un nom', overview: '' });

    expect((await service.get(series.id)).alternates).toEqual([]);
  });

  it('ignores a locale that is not in i18n.supported_languages', async () => {
    const series = await createTestTvSeries(testDb.db);
    await addTranslation(series.id, 'xx-XX', { name: 'Nope', overview: 'Nope.' });

    expect((await service.get(series.id)).alternates).toEqual([]);
  });

  it('serves the second call from the cache without touching the database', async () => {
    const series = await createTestTvSeries(testDb.db, { originalName: 'The Show' });
    await addTranslation(series.id, 'fr-FR', { name: 'La Serie', overview: 'Un resume.' });

    const first = await service.get(series.id);
    await testDb.db.delete(tmdbTvSeriesTranslation);
    const second = await service.get(series.id);

    expect(cache.setCallCount).toBe(1);
    expect(second.alternates).toEqual(first.alternates);
    expect(second.alternates[0].path).toBe(`/tv-series/${series.id}-la-serie`);
  });
});
