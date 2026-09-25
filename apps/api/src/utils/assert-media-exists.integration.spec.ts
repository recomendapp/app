import { NotFoundException } from '@nestjs/common';
import { createTestMovie, createTestTvSeries, TestDatabase } from '@libs/testing';
import { assertMediaExists } from './assert-media-exists';

describe('assertMediaExists', () => {
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

  it('throws NotFoundException when the movie does not exist', async () => {
    await expect(assertMediaExists(testDb.db, 'movie', 999999)).rejects.toThrow(NotFoundException);
  });

  it('resolves when the movie exists', async () => {
    const movie = await createTestMovie(testDb.db);

    await expect(assertMediaExists(testDb.db, 'movie', movie.id)).resolves.toBeUndefined();
  });

  it('throws NotFoundException when the tv series does not exist', async () => {
    await expect(assertMediaExists(testDb.db, 'tv_series', 999999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolves when the tv series exists', async () => {
    const series = await createTestTvSeries(testDb.db);

    await expect(assertMediaExists(testDb.db, 'tv_series', series.id)).resolves.toBeUndefined();
  });

  it('does not cross-match a movie id against a tv series', async () => {
    const movie = await createTestMovie(testDb.db);

    await expect(assertMediaExists(testDb.db, 'tv_series', movie.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
