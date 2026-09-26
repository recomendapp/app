import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profile, reviewMovieComment } from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestReviewMovie,
  createTestReviewMovieComment,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../../../auth/auth.service';
import { ReviewMovieCommentLikesService } from './review-movie-comment-likes.service';

describe('ReviewMovieCommentLikesService', () => {
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

  const asUser = (row: { id: string }) => row as unknown as User;

  it('likes a comment, increments the trigger-maintained count, and notifies its author', async () => {
    const { user: reviewAuthor } = await createTestUser(testDb.db);
    const { user: commentAuthor } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: reviewAuthor.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: commentAuthor.id,
    });

    const notify = createFakeNotifyClient();
    const service = new ReviewMovieCommentLikesService(testDb.db, notify);

    await service.like({ user: asUser(liker), reviewId: review.id, commentId: comment.id });

    const likedByLiker = await service.getLike({
      user: asUser(liker),
      reviewId: review.id,
      commentId: comment.id,
    });
    expect(likedByLiker).toBe(true);

    const [updatedComment] = await testDb.db
      .select({ likesCount: reviewMovieComment.likesCount })
      .from(reviewMovieComment)
      .where(eq(reviewMovieComment.id, comment.id));
    expect(updatedComment.likesCount).toBe(1);

    expect(notify.emit).toHaveBeenCalledTimes(1);
    expect(notify.emit).toHaveBeenCalledWith('review-comment:liked', {
      actorId: liker.id,
      targetUserId: commentAuthor.id,
      reviewAuthorId: reviewAuthor.id,
      reviewId: review.id,
      commentId: comment.id,
      mediaId: expect.any(Number),
      mediaType: 'movie',
    });
  });

  it('is idempotent: liking twice only counts and notifies once', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const notify = createFakeNotifyClient();
    const service = new ReviewMovieCommentLikesService(testDb.db, notify);

    await service.like({ user: asUser(liker), reviewId: review.id, commentId: comment.id });
    await service.like({ user: asUser(liker), reviewId: review.id, commentId: comment.id });

    const [updatedComment] = await testDb.db
      .select({ likesCount: reviewMovieComment.likesCount })
      .from(reviewMovieComment)
      .where(eq(reviewMovieComment.id, comment.id));
    expect(updatedComment.likesCount).toBe(1);
    expect(notify.emit).toHaveBeenCalledTimes(1);
  });

  it('does not notify when the author likes their own comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const notify = createFakeNotifyClient();
    const service = new ReviewMovieCommentLikesService(testDb.db, notify);

    await service.like({ user: asUser(author), reviewId: review.id, commentId: comment.id });

    expect(notify.emit).not.toHaveBeenCalled();
  });

  it('rejects liking a deleted comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(
      testDb.db,
      { reviewId: review.id, userId: author.id },
      { deletedAt: new Date().toISOString() },
    );

    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.like({ user: asUser(liker), reviewId: review.id, commentId: comment.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects liking a comment that belongs to a different review', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review: reviewA } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const { review: reviewB } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const commentOnA = await createTestReviewMovieComment(testDb.db, {
      reviewId: reviewA.id,
      userId: author.id,
    });

    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.like({ user: asUser(liker), reviewId: reviewB.id, commentId: commentOnA.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('unlikes a comment and decrements the count', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());

    await service.like({ user: asUser(liker), reviewId: review.id, commentId: comment.id });
    await service.unlike({ user: asUser(liker), reviewId: review.id, commentId: comment.id });

    const likedAfterUnlike = await service.getLike({
      user: asUser(liker),
      reviewId: review.id,
      commentId: comment.id,
    });
    expect(likedAfterUnlike).toBe(false);

    const [updatedComment] = await testDb.db
      .select({ likesCount: reviewMovieComment.likesCount })
      .from(reviewMovieComment)
      .where(eq(reviewMovieComment.id, comment.id));
    expect(updatedComment.likesCount).toBe(0);
  });

  it('throws when unliking a comment that was never liked', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.unlike({ user: asUser(stranger), reviewId: review.id, commentId: comment.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists who liked a comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: liker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());
    await service.like({ user: asUser(liker), reviewId: review.id, commentId: comment.id });

    const result = await service.listPaginated({
      currentUser: null,
      reviewId: review.id,
      commentId: comment.id,
      query: { page: 1, per_page: 20 },
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(liker.id);
  });

  it('paginates who liked a comment with a cursor', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: firstLiker } = await createTestUser(testDb.db);
    const { user: secondLiker } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());
    await service.like({ user: asUser(firstLiker), reviewId: review.id, commentId: comment.id });
    await service.like({ user: asUser(secondLiker), reviewId: review.id, commentId: comment.id });

    const firstPage = await service.listInfinite({
      currentUser: null,
      reviewId: review.id,
      commentId: comment.id,
      query: { per_page: 1 },
    });
    expect(firstPage.data).toHaveLength(1);
    expect(firstPage.data[0].id).toBe(secondLiker.id);
    expect(firstPage.meta.next_cursor).not.toBeNull();

    const secondPage = await service.listInfinite({
      currentUser: null,
      reviewId: review.id,
      commentId: comment.id,
      query: { per_page: 1, cursor: firstPage.meta.next_cursor ?? undefined },
    });
    expect(secondPage.data).toHaveLength(1);
    expect(secondPage.data[0].id).toBe(firstLiker.id);
    expect(secondPage.meta.next_cursor).toBeNull();
  });

  it('rejects a cursor that is not valid base64-encoded JSON', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.listInfinite({
        currentUser: null,
        reviewId: review.id,
        commentId: comment.id,
        query: { per_page: 10, cursor: 'not-a-valid-cursor' },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a cursor that decodes to the wrong shape', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.listInfinite({
        currentUser: null,
        reviewId: review.id,
        commentId: comment.id,
        query: { per_page: 10, cursor: wrongShapeCursor },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('hides comments under a private review from a stranger', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
    const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
    const comment = await createTestReviewMovieComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const service = new ReviewMovieCommentLikesService(testDb.db, createFakeNotifyClient());

    await expect(
      service.like({ user: asUser(stranger), reviewId: review.id, commentId: comment.id }),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.listPaginated({
        reviewId: review.id,
        commentId: comment.id,
        currentUser: asUser(stranger),
        query: { page: 1, per_page: 10 },
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
