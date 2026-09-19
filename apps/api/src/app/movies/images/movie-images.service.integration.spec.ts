import { tmdbMovieImage } from '@libs/db/schemas';
import { createTestMovie, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { MovieImageType } from './movie-images.dto';
import { MovieImagesService } from './movie-images.service';

describe('MovieImagesService', () => {
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

  const service = () => new MovieImagesService(testDb.db);

  async function addImage(
    movieId: number,
    overrides?: Partial<typeof tmdbMovieImage.$inferInsert>,
  ) {
    const [row] = await testDb.db
      .insert(tmdbMovieImage)
      .values({
        movieId,
        filePath: `/${Math.random().toString(36).slice(2)}.jpg`,
        type: 'poster',
        ...overrides,
      })
      .returning();
    return row;
  }

  describe('listPaginated', () => {
    it('returns an empty list when the movie has no images', async () => {
      const movie = await createTestMovie(testDb.db);

      const result = await service().listPaginated({
        movieId: movie.id,
        query: { page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('filters by type', async () => {
      const movie = await createTestMovie(testDb.db);
      const poster = await addImage(movie.id, { type: 'poster' });
      await addImage(movie.id, { type: 'backdrop' });

      const result = await service().listPaginated({
        movieId: movie.id,
        query: { page: 1, per_page: 10, type: MovieImageType.POSTER },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((i) => i.id)).toEqual([poster.id]);
    });

    it('does not leak images from another movie', async () => {
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      await addImage(movieB.id);

      const result = await service().listPaginated({
        movieId: movieA.id,
        query: { page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('orders images without a language before images in an unrelated language, and by vote average within that bucket', async () => {
      const movie = await createTestMovie(testDb.db);
      const lowerVoteNoLang = await addImage(movie.id, { iso6391: null, voteAverage: 5 });
      const higherVoteNoLang = await addImage(movie.id, { iso6391: null, voteAverage: 9 });
      const otherLanguage = await addImage(movie.id, { iso6391: 'xx', voteAverage: 100 });

      const result = await service().listPaginated({
        movieId: movie.id,
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
      const movie = await createTestMovie(testDb.db);
      for (let i = 0; i < 3; i++) {
        await addImage(movie.id, { voteAverage: i });
      }

      const page1 = await service().listPaginated({
        movieId: movie.id,
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
      const movie = await createTestMovie(testDb.db);
      const images = [];
      for (let i = 0; i < 3; i++) {
        images.push(await addImage(movie.id, { voteAverage: 10 - i }));
      }

      const firstPage = await service().listInfinite({
        movieId: movie.id,
        query: { per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        movieId: movie.id,
        query: { per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();

      const allIds = [...firstPage.data, ...secondPage.data].map((i) => i.id).sort();
      expect(allIds).toEqual(images.map((i) => i.id).sort());
    });

    it('filters by type on the infinite list too', async () => {
      const movie = await createTestMovie(testDb.db);
      const backdrop = await addImage(movie.id, { type: 'backdrop' });
      await addImage(movie.id, { type: 'poster' });

      const result = await service().listInfinite({
        movieId: movie.id,
        query: { per_page: 10, type: MovieImageType.BACKDROP },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((i) => i.id)).toEqual([backdrop.id]);
    });
  });
});
