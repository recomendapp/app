import { NotFoundException } from '@nestjs/common';
import { tmdbTvSeason, tmdbTvSeriesCredit, tmdbTvSeriesRole } from '@libs/db/schemas';
import { createTestPerson, createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { TvSeriesService } from './tv-series.service';

function randomCreditId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

describe('TvSeriesService', () => {
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

  const service = () => new TvSeriesService(testDb.db);

  describe('get', () => {
    it('throws when the tv series does not exist', async () => {
      await expect(
        service().get({ tvSeriesId: 999999, currentUser: null, locale: defaultSupportedLocale }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the tv series', async () => {
      const series = await createTestTvSeries(testDb.db, { originalName: 'Test Series' });

      const result = await service().get({
        tvSeriesId: series.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.id).toBe(series.id);
    });
  });

  describe('getSeasons', () => {
    it('returns an empty array when the series has no seasons', async () => {
      const series = await createTestTvSeries(testDb.db);

      const result = await service().getSeasons({
        tvSeriesId: series.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('orders specials (season 0) last, then by season number', async () => {
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(tmdbTvSeason).values([
        {
          id: randomTmdbId(),
          tvSeriesId: series.id,
          seasonNumber: 2,
          episodeCount: 5,
          voteAverage: 0,
          voteCount: 0,
        },
        {
          id: randomTmdbId(),
          tvSeriesId: series.id,
          seasonNumber: 0,
          episodeCount: 1,
          voteAverage: 0,
          voteCount: 0,
        },
        {
          id: randomTmdbId(),
          tvSeriesId: series.id,
          seasonNumber: 1,
          episodeCount: 8,
          voteAverage: 0,
          voteCount: 0,
        },
      ]);

      const result = await service().getSeasons({
        tvSeriesId: series.id,
        locale: defaultSupportedLocale,
      });

      expect(result.map((s) => s.seasonNumber)).toEqual([1, 2, 0]);
    });

    it('does not leak seasons from another series', async () => {
      const seriesA = await createTestTvSeries(testDb.db);
      const seriesB = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(tmdbTvSeason)
        .values({
          id: randomTmdbId(),
          tvSeriesId: seriesB.id,
          seasonNumber: 1,
          episodeCount: 5,
          voteAverage: 0,
          voteCount: 0,
        });

      const result = await service().getSeasons({
        tvSeriesId: seriesA.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });
  });

  describe('getCasting', () => {
    it('returns an empty array when the series has no cast credits', async () => {
      const series = await createTestTvSeries(testDb.db);

      const result = await service().getCasting({
        tvSeriesId: series.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('excludes non-Actor credits', async () => {
      const series = await createTestTvSeries(testDb.db);
      const creator = await createTestPerson(testDb.db);
      await testDb.db.insert(tmdbTvSeriesCredit).values({
        id: randomCreditId(),
        tvSeriesId: series.id,
        personId: creator.id,
        department: 'Writing',
        job: 'Creator',
      });

      const result = await service().getCasting({
        tvSeriesId: series.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('returns actor credits ordered by role order, with roles aggregated', async () => {
      const series = await createTestTvSeries(testDb.db);
      const lead = await createTestPerson(testDb.db, { name: 'Lead Actor' });
      const supporting = await createTestPerson(testDb.db, { name: 'Supporting Actor' });

      const leadCreditId = randomCreditId();
      await testDb.db.insert(tmdbTvSeriesCredit).values({
        id: leadCreditId,
        tvSeriesId: series.id,
        personId: lead.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db
        .insert(tmdbTvSeriesRole)
        .values({ creditId: leadCreditId, character: 'Hero', order: 0 });

      const supportingCreditId = randomCreditId();
      await testDb.db.insert(tmdbTvSeriesCredit).values({
        id: supportingCreditId,
        tvSeriesId: series.id,
        personId: supporting.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db
        .insert(tmdbTvSeriesRole)
        .values({ creditId: supportingCreditId, character: 'Sidekick', order: 1 });

      const result = await service().getCasting({
        tvSeriesId: series.id,
        locale: defaultSupportedLocale,
      });

      expect(result.map((c) => c.person.id)).toEqual([lead.id, supporting.id]);
      expect(result[0].roles).toEqual([{ character: 'Hero', order: 0 }]);
    });

    it('does not leak credits from another series', async () => {
      const seriesA = await createTestTvSeries(testDb.db);
      const seriesB = await createTestTvSeries(testDb.db);
      const actor = await createTestPerson(testDb.db);
      const creditId = randomCreditId();
      await testDb.db.insert(tmdbTvSeriesCredit).values({
        id: creditId,
        tvSeriesId: seriesB.id,
        personId: actor.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db.insert(tmdbTvSeriesRole).values({ creditId, character: 'Someone', order: 0 });

      const result = await service().getCasting({
        tvSeriesId: seriesA.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });
  });
});
