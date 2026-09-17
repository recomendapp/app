import { uiBackground } from '@libs/db/schemas';
import { createTestMovie, createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { UiBackgroundWithMovieDto, UiBackgroundWithTvSeriesDto } from './ui-backgrounds.dto';
import { UiBackgroundsService } from './ui-backgrounds.service';

describe('UiBackgroundsService', () => {
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

  describe('listAll', () => {
    it('returns an empty array when there are no backgrounds', async () => {
      const service = new UiBackgroundsService(testDb.db);

      await expect(service.listAll({ query: {}, locale: defaultSupportedLocale })).resolves.toEqual(
        [],
      );
    });

    it('returns a movie background with its media and a full TMDB image url', async () => {
      const movie = await createTestMovie(testDb.db);
      await testDb.db
        .insert(uiBackground)
        .values({ type: 'movie', movieId: movie.id, filePath: '/backdrop.jpg' });
      const service = new UiBackgroundsService(testDb.db);

      const [result] = (await service.listAll({
        query: {},
        locale: defaultSupportedLocale,
      })) as [UiBackgroundWithMovieDto];

      expect(result.type).toBe('movie');
      expect(result.mediaId).toBe(movie.id);
      expect(result.media.id).toBe(movie.id);
      expect(result.url).toBe('https://image.tmdb.org/t/p/original/backdrop.jpg');
    });

    it('returns a tv series background with its media', async () => {
      const tvSeries = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(uiBackground)
        .values({ type: 'tv_series', tvSeriesId: tvSeries.id, filePath: '/tv-backdrop.jpg' });
      const service = new UiBackgroundsService(testDb.db);

      const [result] = (await service.listAll({
        query: {},
        locale: defaultSupportedLocale,
      })) as [UiBackgroundWithTvSeriesDto];

      expect(result.type).toBe('tv_series');
      expect(result.mediaId).toBe(tvSeries.id);
      expect(result.media.id).toBe(tvSeries.id);
    });

    it('filters by type', async () => {
      const movie = await createTestMovie(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(uiBackground)
        .values({ type: 'movie', movieId: movie.id, filePath: '/m.jpg' });
      await testDb.db
        .insert(uiBackground)
        .values({ type: 'tv_series', tvSeriesId: tvSeries.id, filePath: '/t.jpg' });
      const service = new UiBackgroundsService(testDb.db);

      const movieOnly = await service.listAll({
        query: { type: 'movie' },
        locale: defaultSupportedLocale,
      });
      expect(movieOnly).toHaveLength(1);
      expect(movieOnly[0].type).toBe('movie');

      const tvOnly = await service.listAll({
        query: { type: 'tv_series' },
        locale: defaultSupportedLocale,
      });
      expect(tvOnly).toHaveLength(1);
      expect(tvOnly[0].type).toBe('tv_series');
    });

    it('returns every background when no filter is given', async () => {
      const movie = await createTestMovie(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(uiBackground)
        .values({ type: 'movie', movieId: movie.id, filePath: '/m.jpg' });
      await testDb.db
        .insert(uiBackground)
        .values({ type: 'tv_series', tvSeriesId: tvSeries.id, filePath: '/t.jpg' });
      const service = new UiBackgroundsService(testDb.db);

      const result = await service.listAll({ query: {}, locale: defaultSupportedLocale });

      expect(result).toHaveLength(2);
    });
  });
});
