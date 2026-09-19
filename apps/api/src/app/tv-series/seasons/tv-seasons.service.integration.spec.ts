import { NotFoundException } from '@nestjs/common';
import { tmdbTvSeason } from '@libs/db/schemas';
import { createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { TvSeasonsService } from './tv-seasons.service';

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

describe('TvSeasonsService', () => {
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

  const service = () => new TvSeasonsService(testDb.db);

  describe('get', () => {
    it('throws when the season does not exist', async () => {
      const series = await createTestTvSeries(testDb.db);

      await expect(
        service().get({
          tvSeriesId: series.id,
          seasonNumber: 1,
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the season with its parent tv series', async () => {
      const series = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(tmdbTvSeason)
        .values({
          id: randomTmdbId(),
          tvSeriesId: series.id,
          seasonNumber: 1,
          episodeCount: 8,
          voteAverage: 0,
          voteCount: 0,
        });

      const result = await service().get({
        tvSeriesId: series.id,
        seasonNumber: 1,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.seasonNumber).toBe(1);
      expect(result.episodeCount).toBe(8);
      expect(result.tvSeries.id).toBe(series.id);
    });

    it('does not leak a season from another series', async () => {
      const seriesA = await createTestTvSeries(testDb.db);
      const seriesB = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(tmdbTvSeason)
        .values({
          id: randomTmdbId(),
          tvSeriesId: seriesB.id,
          seasonNumber: 1,
          episodeCount: 8,
          voteAverage: 0,
          voteCount: 0,
        });

      await expect(
        service().get({
          tvSeriesId: seriesA.id,
          seasonNumber: 1,
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
