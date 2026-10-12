import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'bun:test';
import { createTestMovie, TestDatabase } from '@libs/testing';
import { tmdbMovieTranslation } from '@libs/db/schemas';
import type { CacheService } from '../../../common/modules/cache/cache.service';
import { MovieMetadataService } from './movie-metadata.service';

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

describe('MovieMetadataService', () => {
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
  let service: MovieMetadataService;

  beforeEach(() => {
    cache = new FakeCacheService();
    service = new MovieMetadataService(testDb.db, cache as unknown as CacheService);
  });

  const addTranslation = (
    movieId: number,
    locale: string,
    fields: { title?: string | null; overview?: string | null },
  ) => {
    const [iso6391, iso31661] = locale.split('-');
    return testDb.db.insert(tmdbMovieTranslation).values({ movieId, iso6391, iso31661, ...fields });
  };

  it('returns nothing for a movie with no translation rows', async () => {
    const movie = await createTestMovie(testDb.db);

    const metadata = await service.get(movie.id);

    expect(metadata.alternates).toEqual([]);
  });

  it('lists a locale that has an overview of its own, with its localized path', async () => {
    const movie = await createTestMovie(testDb.db, { originalTitle: 'The Movie' });
    await addTranslation(movie.id, 'fr-FR', { title: 'Le Film', overview: 'Un resume.' });

    const metadata = await service.get(movie.id);

    expect(metadata.alternates).toEqual([
      { locale: 'fr-FR', slug: `${movie.id}-le-film`, path: `/film/${movie.id}-le-film` },
    ]);
  });

  // The slug follows the localized title, so each locale's href differs. Emitting the
  // default locale's slug for every language would point hreflang at URLs whose own
  // canonical says something else, and Google discards mismatched annotations.
  it('gives each locale the slug built from its own title', async () => {
    const movie = await createTestMovie(testDb.db, { originalTitle: 'The Movie' });
    await addTranslation(movie.id, 'en-US', { title: '', overview: 'An overview.' });
    await addTranslation(movie.id, 'fr-FR', { title: 'Le Film', overview: 'Un resume.' });

    const metadata = await service.get(movie.id);

    const paths = Object.fromEntries(metadata.alternates.map((a) => [a.locale, a.path]));
    expect(paths['fr-FR']).toBe(`/film/${movie.id}-le-film`);
    // Falls back to the original title, exactly as every other movie response does.
    expect(paths['en-US']).toBe(`/film/${movie.id}-the-movie`);
  });

  // The regression this endpoint exists to avoid: TMDB leaves `title` empty when it
  // equals the original title, so keying the set off `title` drops en-US itself on any
  // film with an English original title.
  it('lists a locale whose title is empty but whose overview is translated', async () => {
    const movie = await createTestMovie(testDb.db, { originalTitle: 'The Movie' });
    await addTranslation(movie.id, 'en-US', { title: '', overview: 'An overview.' });

    const metadata = await service.get(movie.id);

    expect(metadata.alternates.map((a) => a.locale)).toEqual(['en-US']);
  });

  it('excludes a locale that has a title but no overview', async () => {
    const movie = await createTestMovie(testDb.db);
    await addTranslation(movie.id, 'fa-IR', { title: 'Un titre', overview: '' });

    const metadata = await service.get(movie.id);

    expect(metadata.alternates).toEqual([]);
  });

  it('drops a row whose fields are all empty rather than reporting the locale', async () => {
    const movie = await createTestMovie(testDb.db);
    await addTranslation(movie.id, 'de-DE', { title: '', overview: '   ' });

    const metadata = await service.get(movie.id);

    expect(metadata.alternates).toEqual([]);
  });

  // TMDB carries translations for locales the app does not serve; an hreflang pointing
  // at a URL that cannot exist is worse than no annotation at all.
  it('ignores a locale that is not in i18n.supported_languages', async () => {
    const movie = await createTestMovie(testDb.db);
    await addTranslation(movie.id, 'xx-XX', { title: 'Nope', overview: 'Nope.' });

    const metadata = await service.get(movie.id);

    expect(metadata.alternates).toEqual([]);
  });

  it('serves the second call from the cache without touching the database', async () => {
    const movie = await createTestMovie(testDb.db);
    await addTranslation(movie.id, 'fr-FR', { title: 'Le Film', overview: 'Un resume.' });

    const first = await service.get(movie.id);
    await testDb.db.delete(tmdbMovieTranslation);
    const second = await service.get(movie.id);

    expect(cache.setCallCount).toBe(1);
    expect(second.alternates).toEqual(first.alternates);
  });
});
