import { tmdbTvSeriesImage } from '@libs/db/schemas';
import { createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { TvSeriesImageType } from './tv-series-images.dto';
import { TvSeriesImagesService } from './tv-series-images.service';

describe('TvSeriesImagesService', () => {
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

  const service = () => new TvSeriesImagesService(testDb.db);

  async function addImage(
    tvSeriesId: number,
    overrides?: Partial<typeof tmdbTvSeriesImage.$inferInsert>,
  ) {
    const [row] = await testDb.db
      .insert(tmdbTvSeriesImage)
      .values({
        tvSeriesId,
        filePath: `/${Math.random().toString(36).slice(2)}.jpg`,
        type: 'poster',
        ...overrides,
      })
      .returning();
    return row;
  }

  describe('listPaginated', () => {
    it('returns an empty list when the series has no images', async () => {
      const series = await createTestTvSeries(testDb.db);

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('filters by type', async () => {
      const series = await createTestTvSeries(testDb.db);
      const poster = await addImage(series.id, { type: 'poster' });
      await addImage(series.id, { type: 'backdrop' });

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { page: 1, per_page: 10, type: TvSeriesImageType.POSTER },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((i) => i.id)).toEqual([poster.id]);
    });

    it('does not leak images from another series', async () => {
      const seriesA = await createTestTvSeries(testDb.db);
      const seriesB = await createTestTvSeries(testDb.db);
      await addImage(seriesB.id);

      const result = await service().listPaginated({
        tvSeriesId: seriesA.id,
        query: { page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('orders images without a language before images in an unrelated language, and by vote average within that bucket', async () => {
      const series = await createTestTvSeries(testDb.db);
      const lowerVoteNoLang = await addImage(series.id, { iso6391: null, voteAverage: 5 });
      const higherVoteNoLang = await addImage(series.id, { iso6391: null, voteAverage: 9 });
      const otherLanguage = await addImage(series.id, { iso6391: 'xx', voteAverage: 100 });

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((i) => i.id)).toEqual([
        higherVoteNoLang.id,
        lowerVoteNoLang.id,
        otherLanguage.id,
      ]);
    });

    it('paginates results and reports accurate meta', async () => {
      const series = await createTestTvSeries(testDb.db);
      for (let i = 0; i < 3; i++) {
        await addImage(series.id, { voteAverage: i });
      }

      const page1 = await service().listPaginated({
        tvSeriesId: series.id,
        query: { page: 1, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(page1.data).toHaveLength(2);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const series = await createTestTvSeries(testDb.db);
      const images = [];
      for (let i = 0; i < 3; i++) {
        images.push(await addImage(series.id, { voteAverage: 10 - i }));
      }

      const firstPage = await service().listInfinite({
        tvSeriesId: series.id,
        query: { per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        tvSeriesId: series.id,
        query: { per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();

      const allIds = [...firstPage.data, ...secondPage.data].map((i) => i.id).sort();
      expect(allIds).toEqual(images.map((i) => i.id).sort());
    });

    it('filters by type on the infinite list too', async () => {
      const series = await createTestTvSeries(testDb.db);
      const backdrop = await addImage(series.id, { type: 'backdrop' });
      await addImage(series.id, { type: 'poster' });

      const result = await service().listInfinite({
        tvSeriesId: series.id,
        query: { per_page: 10, type: TvSeriesImageType.BACKDROP },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((i) => i.id)).toEqual([backdrop.id]);
    });
  });
});
