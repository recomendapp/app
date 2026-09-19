import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { createTestMovie, createTestTvSeries, TestDatabase } from '@libs/testing';
import { MediaType } from '../enums/medias.enum';
import { MediaExistsGuard } from './media-exists.guard';

describe('MediaExistsGuard', () => {
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

  const guard = () => new MediaExistsGuard(testDb.db);

  function contextFor(params: Record<string, string | undefined>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ params }) }),
    } as unknown as ExecutionContext;
  }

  it('throws BadRequestException when type is missing', async () => {
    await expect(guard().canActivate(contextFor({ media_id: '1' }))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when media_id is missing', async () => {
    await expect(guard().canActivate(contextFor({ type: MediaType.MOVIE }))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when media_id is not a number', async () => {
    await expect(
      guard().canActivate(contextFor({ type: MediaType.MOVIE, media_id: 'not-a-number' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for an unrecognized type', async () => {
    const movie = await createTestMovie(testDb.db);

    await expect(
      guard().canActivate(contextFor({ type: 'album', media_id: String(movie.id) })),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when the movie does not exist', async () => {
    await expect(
      guard().canActivate(contextFor({ type: MediaType.MOVIE, media_id: '999999' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows the request when the movie exists', async () => {
    const movie = await createTestMovie(testDb.db);

    const result = await guard().canActivate(
      contextFor({ type: MediaType.MOVIE, media_id: String(movie.id) }),
    );

    expect(result).toBe(true);
  });

  it('throws NotFoundException when the tv series does not exist', async () => {
    await expect(
      guard().canActivate(contextFor({ type: MediaType.TV_SERIES, media_id: '999999' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows the request when the tv series exists', async () => {
    const series = await createTestTvSeries(testDb.db);

    const result = await guard().canActivate(
      contextFor({ type: MediaType.TV_SERIES, media_id: String(series.id) }),
    );

    expect(result).toBe(true);
  });

  it('does not cross-match a movie id against a tv series (and vice versa)', async () => {
    const movie = await createTestMovie(testDb.db);

    await expect(
      guard().canActivate(contextFor({ type: MediaType.TV_SERIES, media_id: String(movie.id) })),
    ).rejects.toThrow(NotFoundException);
  });
});
