import { NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { tmdbMovieCredit, tmdbMovieRole } from '@libs/db/schemas';
import { createTestMovie, createTestPerson, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { MoviesService } from './movies.service';

function randomCreditId(): string {
  return randomBytes(12).toString('hex');
}

describe('MoviesService', () => {
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

  describe('get', () => {
    it('throws when the movie does not exist', async () => {
      const service = new MoviesService(testDb.db);

      await expect(
        service.get({ movieId: 999999, currentUser: null, locale: defaultSupportedLocale }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the movie', async () => {
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Test Movie Title' });
      const service = new MoviesService(testDb.db);

      const result = await service.get({
        movieId: movie.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.id).toBe(movie.id);
    });
  });

  describe('getCasting', () => {
    it('returns an empty array when the movie has no cast credits', async () => {
      const movie = await createTestMovie(testDb.db);
      const service = new MoviesService(testDb.db);

      const result = await service.getCasting({
        movieId: movie.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('excludes non-Actor credits', async () => {
      const movie = await createTestMovie(testDb.db);
      const director = await createTestPerson(testDb.db);
      await testDb.db.insert(tmdbMovieCredit).values({
        id: randomCreditId(),
        movieId: movie.id,
        personId: director.id,
        department: 'Directing',
        job: 'Director',
      });
      const service = new MoviesService(testDb.db);

      const result = await service.getCasting({
        movieId: movie.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('returns actor credits ordered by role order, with roles aggregated', async () => {
      const movie = await createTestMovie(testDb.db);
      const lead = await createTestPerson(testDb.db, { name: 'Lead Actor' });
      const supporting = await createTestPerson(testDb.db, { name: 'Supporting Actor' });

      const leadCreditId = randomCreditId();
      await testDb.db.insert(tmdbMovieCredit).values({
        id: leadCreditId,
        movieId: movie.id,
        personId: lead.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db
        .insert(tmdbMovieRole)
        .values({ creditId: leadCreditId, character: 'Hero', order: 0 });

      const supportingCreditId = randomCreditId();
      await testDb.db.insert(tmdbMovieCredit).values({
        id: supportingCreditId,
        movieId: movie.id,
        personId: supporting.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db
        .insert(tmdbMovieRole)
        .values({ creditId: supportingCreditId, character: 'Sidekick', order: 1 });

      const service = new MoviesService(testDb.db);
      const result = await service.getCasting({
        movieId: movie.id,
        locale: defaultSupportedLocale,
      });

      expect(result.map((c) => c.person.id)).toEqual([lead.id, supporting.id]);
      expect(result[0].roles).toEqual([{ character: 'Hero', order: 0 }]);
    });

    it('aggregates roles from multiple credit rows for the same actor (e.g. dual roles)', async () => {
      const movie = await createTestMovie(testDb.db);
      const actor = await createTestPerson(testDb.db);

      const firstCreditId = randomCreditId();
      await testDb.db.insert(tmdbMovieCredit).values({
        id: firstCreditId,
        movieId: movie.id,
        personId: actor.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db
        .insert(tmdbMovieRole)
        .values({ creditId: firstCreditId, character: 'Villain', order: 2 });

      const secondCreditId = randomCreditId();
      await testDb.db.insert(tmdbMovieCredit).values({
        id: secondCreditId,
        movieId: movie.id,
        personId: actor.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db
        .insert(tmdbMovieRole)
        .values({ creditId: secondCreditId, character: 'Villain (voice)', order: 5 });

      const service = new MoviesService(testDb.db);
      const [result] = await service.getCasting({
        movieId: movie.id,
        locale: defaultSupportedLocale,
      });

      // The two credit rows collapse into a single person entry, `order` taking the minimum
      // and `roles` carrying both characters.
      expect(result.order).toBe(2);
      expect(result.roles).toEqual([
        { character: 'Villain', order: 2 },
        { character: 'Villain (voice)', order: 5 },
      ]);
    });

    it('does not leak credits from another movie', async () => {
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      const actor = await createTestPerson(testDb.db);
      const creditId = randomCreditId();
      await testDb.db.insert(tmdbMovieCredit).values({
        id: creditId,
        movieId: movieB.id,
        personId: actor.id,
        department: 'Acting',
        job: 'Actor',
      });
      await testDb.db.insert(tmdbMovieRole).values({ creditId, character: 'Someone', order: 0 });
      const service = new MoviesService(testDb.db);

      const result = await service.getCasting({
        movieId: movieA.id,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });
  });
});
