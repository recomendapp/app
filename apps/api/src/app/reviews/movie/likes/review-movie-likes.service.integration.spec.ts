import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profile, reviewMovie } from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestReviewMovie,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../../auth/auth.service';
import { ReviewMovieLikesService } from './review-movie-likes.service';

describe('ReviewMovieLikesService', () => {
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

  // Fixtures return the raw `user` table row; the services only ever read
  // `.id` off the better-auth-inferred `User` type they declare, so this
  // cast is enough without pulling in a real auth session.
  const asUser = (row: { id: string }) => row as unknown as User;

  it('likes a review, increments the trigger-maintained count, and notifies the author', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review, log } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const notify = createFakeNotifyClient();
    const service = new ReviewMovieLikesService(testDb.db, notify);

    await service.like({ user: asUser(liker), reviewId: review.id });

    const likedByLiker = await service.getLike({ user: asUser(liker), reviewId: review.id });
    expect(likedByLiker).toBe(true);

    const [updatedReview] = await testDb.db
      .select({ likesCount: reviewMovie.likesCount })
      .from(reviewMovie)
      .where(eq(reviewMovie.id, review.id));
    expect(updatedReview.likesCount).toBe(1);

    expect(notify.emit).toHaveBeenCalledTimes(1);
    expect(notify.emit).toHaveBeenCalledWith('review:liked', {
      actorId: liker.id,
      targetUserId: author.id,
      reviewAuthorId: author.id,
      reviewId: review.id,
      mediaId: log.movieId,
      mediaType: 'movie',
    });
  });

  it('is idempotent: liking twice only counts and notifies once', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const notify = createFakeNotifyClient();
    const service = new ReviewMovieLikesService(testDb.db, notify);

    await service.like({ user: asUser(liker), reviewId: review.id });
    await service.like({ user: asUser(liker), reviewId: review.id });

    const [updatedReview] = await testDb.db
      .select({ likesCount: reviewMovie.likesCount })
      .from(reviewMovie)
      .where(eq(reviewMovie.id, review.id));
    expect(updatedReview.likesCount).toBe(1);
    expect(notify.emit).toHaveBeenCalledTimes(1);
  });

  it('does not notify when the author likes their own review', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const notify = createFakeNotifyClient();
    const service = new ReviewMovieLikesService(testDb.db, notify);

    await service.like({ user: asUser(author), reviewId: review.id });

    const [updatedReview] = await testDb.db
      .select({ likesCount: reviewMovie.likesCount })
      .from(reviewMovie)
      .where(eq(reviewMovie.id, review.id));
    expect(updatedReview.likesCount).toBe(1);
    expect(notify.emit).not.toHaveBeenCalled();
  });

  it('rejects liking a private review from a non-follower', async () => {
    const { user: author } = await createTestUser(testDb.db);
    await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
    const { user: stranger } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());

    await expect(service.like({ user: asUser(stranger), reviewId: review.id })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('unlikes a review and decrements the count', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());

    await service.like({ user: asUser(liker), reviewId: review.id });
    await service.unlike({ user: asUser(liker), reviewId: review.id });

    const likedAfterUnlike = await service.getLike({ user: asUser(liker), reviewId: review.id });
    expect(likedAfterUnlike).toBe(false);

    const [updatedReview] = await testDb.db
      .select({ likesCount: reviewMovie.likesCount })
      .from(reviewMovie)
      .where(eq(reviewMovie.id, review.id));
    expect(updatedReview.likesCount).toBe(0);
  });

  it('throws when unliking a review that was never liked', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());

    await expect(service.unlike({ user: asUser(stranger), reviewId: review.id })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lists who liked a review', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());
    await service.like({ user: asUser(liker), reviewId: review.id });

    const result = await service.listPaginated({
      reviewId: review.id,
      query: { page: 1, per_page: 20 },
      currentUser: asUser(author),
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(liker.id);
  });

  it('paginates who liked a review with a cursor', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: firstLiker } = await createTestUser(testDb.db);
    const { user: secondLiker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());
    await service.like({ user: asUser(firstLiker), reviewId: review.id });
    await service.like({ user: asUser(secondLiker), reviewId: review.id });

    const firstPage = await service.listInfinite({
      reviewId: review.id,
      query: { per_page: 1 },
      currentUser: asUser(author),
    });
    expect(firstPage.data).toHaveLength(1);
    expect(firstPage.data[0].id).toBe(secondLiker.id);
    expect(firstPage.meta.next_cursor).not.toBeNull();

    const secondPage = await service.listInfinite({
      reviewId: review.id,
      query: { per_page: 1, cursor: firstPage.meta.next_cursor ?? undefined },
      currentUser: asUser(author),
    });
    expect(secondPage.data).toHaveLength(1);
    expect(secondPage.data[0].id).toBe(firstLiker.id);
    expect(secondPage.meta.next_cursor).toBeNull();
  });

  it('rejects a cursor that is not valid base64-encoded JSON', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.listInfinite({
        reviewId: review.id,
        query: { per_page: 10, cursor: 'not-a-valid-cursor' },
        currentUser: asUser(author),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a cursor that decodes to the wrong shape', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

    const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
    const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.listInfinite({
        reviewId: review.id,
        query: { per_page: 10, cursor: wrongShapeCursor },
        currentUser: asUser(author),
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
