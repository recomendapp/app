import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  logTvSeries,
  profile,
  reviewTvSeries,
  reviewTvSeriesComment,
  reviewTvSeriesCommentLike,
} from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestReviewTvSeries,
  createTestReviewTvSeriesComment,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../../auth/auth.service';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { ReviewTvSeriesCommentSortBy } from './dto/review-tv-series-comments.dto';
import { ReviewTvSeriesCommentsService } from './review-tv-series-comments.service';

describe('ReviewTvSeriesCommentsService', () => {
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
  const listQuery = (overrides?: Partial<{ page: number; per_page: number }>) => ({
    page: 1,
    per_page: 20,
    sort_by: ReviewTvSeriesCommentSortBy.CREATED_AT,
    sort_order: SortOrder.DESC,
    ...overrides,
  });
  const infiniteQuery = (overrides?: Partial<{ cursor: string; per_page: number }>) => ({
    per_page: 20,
    sort_by: ReviewTvSeriesCommentSortBy.CREATED_AT,
    sort_order: SortOrder.DESC,
    ...overrides,
  });

  it('creates a top-level comment, increments the review comment count, and notifies the author', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: commenter } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    const notify = createFakeNotifyClient();
    const service = new ReviewTvSeriesCommentsService(testDb.db, notify);

    const comment = await service.create({
      user: asUser(commenter),
      reviewId: review.id,
      dto: { body: 'Great review!' },
    });

    expect(comment.body).toBe('Great review!');
    expect(comment.parentId).toBeNull();

    const [updatedReview] = await testDb.db
      .select({ commentsCount: reviewTvSeries.commentsCount })
      .from(reviewTvSeries)
      .where(eq(reviewTvSeries.id, review.id));
    expect(updatedReview.commentsCount).toBe(1);

    expect(notify.emit).toHaveBeenCalledTimes(1);
    expect(notify.emit).toHaveBeenCalledWith(
      'review:commented',
      expect.objectContaining({
        actorId: commenter.id,
        targetUserId: author.id,
        reviewAuthorId: author.id,
        reviewId: review.id,
        commentId: comment.id,
      }),
    );
  });

  it('does not notify when the author comments on their own review', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    const notify = createFakeNotifyClient();
    const service = new ReviewTvSeriesCommentsService(testDb.db, notify);

    await service.create({
      user: asUser(author),
      reviewId: review.id,
      dto: { body: 'My own take' },
    });

    expect(notify.emit).not.toHaveBeenCalled();
  });

  it('creates a reply, increments the parent repliesCount, and notifies the parent author', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: commenter } = await createTestUser(testDb.db);
    const { user: replier } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    const notify = createFakeNotifyClient();
    const service = new ReviewTvSeriesCommentsService(testDb.db, notify);

    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: commenter.id,
    });
    notify.emit.mockClear();

    const reply = await service.create({
      user: asUser(replier),
      reviewId: review.id,
      dto: { body: 'I agree', parentId: parent.id },
    });

    expect(reply.parentId).toBe(parent.id);

    const [updatedParent] = await testDb.db
      .select({ repliesCount: reviewTvSeriesComment.repliesCount })
      .from(reviewTvSeriesComment)
      .where(eq(reviewTvSeriesComment.id, parent.id));
    expect(updatedParent.repliesCount).toBe(1);

    expect(notify.emit).toHaveBeenCalledTimes(1);
    expect(notify.emit).toHaveBeenCalledWith(
      'review-comment:replied',
      expect.objectContaining({
        actorId: replier.id,
        targetUserId: commenter.id,
        reviewAuthorId: author.id,
        reviewId: review.id,
        commentId: reply.id,
        parentCommentId: parent.id,
      }),
    );
  });

  it('does not notify when replying to your own comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    const notify = createFakeNotifyClient();
    const service = new ReviewTvSeriesCommentsService(testDb.db, notify);

    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    notify.emit.mockClear();

    await service.create({
      user: asUser(author),
      reviewId: review.id,
      dto: { body: 'Following up myself', parentId: parent.id },
    });

    expect(notify.emit).not.toHaveBeenCalled();
  });

  it('rejects replying to a reply', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const reply = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
      parentId: parent.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    await expect(
      service.create({
        user: asUser(author),
        reviewId: review.id,
        dto: { body: 'Reply to a reply', parentId: reply.id },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a parentId that belongs to a different review', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review: reviewA } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const { review: reviewB } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const commentOnA = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: reviewA.id,
      userId: author.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    await expect(
      service.create({
        user: asUser(author),
        reviewId: reviewB.id,
        dto: { body: 'Wrong review', parentId: commentOnA.id },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lets the author edit their own comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    const updated = await service.update({
      user: asUser(author),
      reviewId: review.id,
      commentId: comment.id,
      dto: { body: 'Edited body' },
    });

    expect(updated.body).toBe('Edited body');
  });

  it("rejects editing someone else's comment", async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    await expect(
      service.update({
        user: asUser(stranger),
        reviewId: review.id,
        commentId: comment.id,
        dto: { body: 'Hijacked' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects editing a deleted comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    await service.delete({ user: asUser(author), reviewId: review.id, commentId: comment.id });

    await expect(
      service.update({
        user: asUser(author),
        reviewId: review.id,
        commentId: comment.id,
        dto: { body: 'Too late' },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('hard-deletes a childless top-level comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    await service.delete({ user: asUser(author), reviewId: review.id, commentId: comment.id });

    const remaining = await testDb.db.query.reviewTvSeriesComment.findFirst({
      where: eq(reviewTvSeriesComment.id, comment.id),
    });
    expect(remaining).toBeUndefined();

    const [updatedReview] = await testDb.db
      .select({ commentsCount: reviewTvSeries.commentsCount })
      .from(reviewTvSeries)
      .where(eq(reviewTvSeries.id, review.id));
    expect(updatedReview.commentsCount).toBe(0);
  });

  it('soft-deletes a top-level comment that still has replies, masking the body on refetch', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: replier } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: replier.id,
      parentId: comment.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    const deleted = await service.delete({
      user: asUser(author),
      reviewId: review.id,
      commentId: comment.id,
    });
    expect(deleted.body).toBeNull();

    const stillThere = await testDb.db.query.reviewTvSeriesComment.findFirst({
      where: eq(reviewTvSeriesComment.id, comment.id),
    });
    expect(stillThere).toBeDefined();
    expect(stillThere?.deletedAt).not.toBeNull();
    expect(stillThere?.body).not.toBeNull();

    const list = await service.listPaginated({
      reviewId: review.id,
      query: listQuery(),
      currentUser: asUser(author),
    });
    expect(list.data).toHaveLength(1);
    expect(list.data[0].body).toBeNull();
  });

  it("lets the review author delete someone else's comment", async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: commenter } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: commenter.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    await expect(
      service.delete({ user: asUser(author), reviewId: review.id, commentId: comment.id }),
    ).resolves.toBeDefined();
  });

  it('rejects deletion by neither the comment author nor the review author', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { user: commenter } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: commenter.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    await expect(
      service.delete({ user: asUser(stranger), reviewId: review.id, commentId: comment.id }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects deleting an already-deleted comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    await service.delete({ user: asUser(author), reviewId: review.id, commentId: comment.id });

    await expect(
      service.delete({ user: asUser(author), reviewId: review.id, commentId: comment.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('always hard-deletes a reply and decrements the parent repliesCount', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const reply = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
      parentId: parent.id,
    });
    await testDb.db
      .update(reviewTvSeriesComment)
      .set({ repliesCount: 1 })
      .where(eq(reviewTvSeriesComment.id, parent.id));

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    const deleted = await service.delete({
      user: asUser(author),
      reviewId: review.id,
      commentId: reply.id,
    });
    expect(deleted.body).not.toBeNull();

    const remaining = await testDb.db.query.reviewTvSeriesComment.findFirst({
      where: eq(reviewTvSeriesComment.id, reply.id),
    });
    expect(remaining).toBeUndefined();

    const [updatedParent] = await testDb.db
      .select({ repliesCount: reviewTvSeriesComment.repliesCount })
      .from(reviewTvSeriesComment)
      .where(eq(reviewTvSeriesComment.id, parent.id));
    expect(updatedParent.repliesCount).toBe(0);
  });

  it('drops a soft-deleted comment from the list once its last reply is deleted', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const reply = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
      parentId: parent.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    // Soft-deletes the parent while it still has a reply to hang onto.
    const deletedParent = await service.delete({
      user: asUser(author),
      reviewId: review.id,
      commentId: parent.id,
    });
    expect(deletedParent.body).toBeNull();

    const listWithReply = await service.listPaginated({
      reviewId: review.id,
      query: listQuery(),
      currentUser: asUser(author),
    });
    expect(listWithReply.data.map((c) => c.id)).toEqual([parent.id]);

    // Deletes the only reply - the parent has nothing left to hang onto and
    // should no longer be listed, mirroring getTopLevelWhereClause.
    await service.delete({ user: asUser(author), reviewId: review.id, commentId: reply.id });

    const listAfter = await service.listPaginated({
      reviewId: review.id,
      query: listQuery(),
      currentUser: asUser(author),
    });
    expect(listAfter.data).toHaveLength(0);

    const stillInDb = await testDb.db.query.reviewTvSeriesComment.findFirst({
      where: eq(reviewTvSeriesComment.id, parent.id),
    });
    expect(stillInDb).toBeDefined();
    expect(stillInDb?.repliesCount).toBe(0);
  });

  it('lists top-level comments only, in descending creation order', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const first = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const second = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
      parentId: first.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    const result = await service.listPaginated({
      reviewId: review.id,
      query: listQuery(),
      currentUser: asUser(author),
    });

    expect(result.data.map((c) => c.id)).toEqual([second.id, first.id]);
  });

  it('lists replies to a specific comment', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const otherParent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const reply = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
      parentId: parent.id,
    });
    await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
      parentId: otherParent.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    const result = await service.listRepliesPaginated({
      reviewId: review.id,
      commentId: parent.id,
      query: listQuery(),
      currentUser: asUser(author),
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(reply.id);
  });

  it('sorts by likes count when asked', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const lessLiked = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const mostLiked = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    await testDb.db
      .update(reviewTvSeriesComment)
      .set({ likesCount: 5 })
      .where(eq(reviewTvSeriesComment.id, mostLiked.id));

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    const result = await service.listPaginated({
      reviewId: review.id,
      query: { ...listQuery(), sort_by: ReviewTvSeriesCommentSortBy.LIKES_COUNT },
      currentUser: asUser(author),
    });

    expect(result.data.map((c) => c.id)).toEqual([mostLiked.id, lessLiked.id]);
  });

  it('paginates top-level comments with a cursor', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const first = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const second = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());
    const firstPage = await service.listInfinite({
      reviewId: review.id,
      query: infiniteQuery({ per_page: 1 }),
      currentUser: asUser(author),
    });
    expect(firstPage.data.map((c) => c.id)).toEqual([second.id]);
    expect(firstPage.meta.next_cursor).not.toBeNull();

    const secondPage = await service.listInfinite({
      reviewId: review.id,
      query: infiniteQuery({ per_page: 1, cursor: firstPage.meta.next_cursor ?? undefined }),
      currentUser: asUser(author),
    });
    expect(secondPage.data.map((c) => c.id)).toEqual([first.id]);
    expect(secondPage.meta.next_cursor).toBeNull();
  });

  it('rejects a malformed cursor on listInfinite', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    await expect(
      service.listInfinite({
        reviewId: review.id,
        query: infiniteQuery({ cursor: 'not-a-valid-cursor' }),
        currentUser: asUser(author),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a wrong-shape cursor on listRepliesInfinite', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    await expect(
      service.listRepliesInfinite({
        reviewId: review.id,
        commentId: parent.id,
        query: infiniteQuery({ cursor: wrongShapeCursor }),
        currentUser: asUser(author),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects listing comments on a private review from a non-follower', async () => {
    const { user: author } = await createTestUser(testDb.db);
    await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
    const { user: stranger } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    const service = new ReviewTvSeriesCommentsService(testDb.db, createFakeNotifyClient());

    await expect(
      service.listPaginated({
        reviewId: review.id,
        query: listQuery(),
        currentUser: asUser(stranger),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // The tests above only ever insert/delete one comment row per service
  // call, which the old FOR EACH ROW triggers already handled fine. The
  // ones below exercise the statement-level counter triggers
  // (0076_batch_comment_counters_triggers.sql) directly with multi-row and
  // cascading operations - the thing that actually changed. A self-
  // referential UPDATE on review_tv_series_comment (repliesCount) caused
  // "stack depth limit exceeded" here until guarded with EXISTS checks.
  it('counts a multi-row INSERT of top-level comments in one statement', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    await testDb.db.insert(reviewTvSeriesComment).values(
      Array.from({ length: 7 }, () => ({
        reviewId: review.id,
        userId: author.id,
        body: 'Batch comment',
      })),
    );

    const [updated] = await testDb.db
      .select({ commentsCount: reviewTvSeries.commentsCount })
      .from(reviewTvSeries)
      .where(eq(reviewTvSeries.id, review.id));
    expect(updated.commentsCount).toBe(7);
  });

  it('counts a multi-row INSERT of replies to the same parent in one statement', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });

    await testDb.db.insert(reviewTvSeriesComment).values(
      Array.from({ length: 5 }, () => ({
        reviewId: review.id,
        userId: author.id,
        parentId: parent.id,
        body: 'Batch reply',
      })),
    );

    const [updatedParent] = await testDb.db
      .select({ repliesCount: reviewTvSeriesComment.repliesCount })
      .from(reviewTvSeriesComment)
      .where(eq(reviewTvSeriesComment.id, parent.id));
    expect(updatedParent.repliesCount).toBe(5);
  });

  it('counts a multi-row INSERT of likes on the same comment in one statement', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const comment = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const likers = await Promise.all(Array.from({ length: 10 }, () => createTestUser(testDb.db)));

    await testDb.db
      .insert(reviewTvSeriesCommentLike)
      .values(likers.map(({ user }) => ({ commentId: comment.id, userId: user.id })));

    const [updatedComment] = await testDb.db
      .select({ likesCount: reviewTvSeriesComment.likesCount })
      .from(reviewTvSeriesComment)
      .where(eq(reviewTvSeriesComment.id, comment.id));
    expect(updatedComment.likesCount).toBe(10);
  });

  it('survives cascade-deleting a review with many comments, replies, and comment likes', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { log, review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

    // Several parents, each with a reply and a like - the exact shape that
    // caused infinite recursion before the EXISTS guards: cascade-deleting
    // the review deletes all these review_tv_series_comment rows (parents
    // AND replies together) in one statement, so the reply-count trigger's
    // self-referential UPDATE must not re-fire itself forever.
    const parents = await testDb.db
      .insert(reviewTvSeriesComment)
      .values(
        Array.from({ length: 6 }, () => ({
          reviewId: review.id,
          userId: author.id,
          body: 'Parent',
        })),
      )
      .returning();

    await testDb.db.insert(reviewTvSeriesComment).values(
      parents.map((parent) => ({
        reviewId: review.id,
        userId: author.id,
        parentId: parent.id,
        body: 'Reply',
      })),
    );

    const { user: liker } = await createTestUser(testDb.db);
    await testDb.db
      .insert(reviewTvSeriesCommentLike)
      .values(parents.map((parent) => ({ commentId: parent.id, userId: liker.id })));

    // Deleting the log cascades: log_tv_series -> review_tv_series ->
    // review_tv_series_comment (both parents and replies) ->
    // review_tv_series_comment_like, all in one transaction. Just
    // completing without erroring proves the trigger recursion is fixed.
    await testDb.db.delete(logTvSeries).where(eq(logTvSeries.id, log.id));

    const remainingComments = await testDb.db.query.reviewTvSeriesComment.findMany({
      where: eq(reviewTvSeriesComment.reviewId, review.id),
    });
    expect(remainingComments).toHaveLength(0);

    // The DB is reset before each test, so this test's own likes are the
    // only rows that could exist here - an empty table confirms the
    // cascade reached review_tv_series_comment_like too.
    const remainingLikes = await testDb.db.query.reviewTvSeriesCommentLike.findMany();
    expect(remainingLikes).toHaveLength(0);
  });

  it('drops replies_count to zero when every reply is cascade-deleted alongside its still-existing parent', async () => {
    const { user: author } = await createTestUser(testDb.db);
    const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
    const parent = await createTestReviewTvSeriesComment(testDb.db, {
      reviewId: review.id,
      userId: author.id,
    });
    const replies = await testDb.db
      .insert(reviewTvSeriesComment)
      .values(
        Array.from({ length: 4 }, () => ({
          reviewId: review.id,
          userId: author.id,
          parentId: parent.id,
          body: 'Reply',
        })),
      )
      .returning();
    expect(replies).toHaveLength(4);

    // Bulk-delete just the replies (parent survives) - a multi-row DELETE
    // that does NOT cascade from a parent-side delete, unlike the test above.
    await testDb.db
      .delete(reviewTvSeriesComment)
      .where(eq(reviewTvSeriesComment.parentId, parent.id));

    const [updatedParent] = await testDb.db
      .select({ repliesCount: reviewTvSeriesComment.repliesCount })
      .from(reviewTvSeriesComment)
      .where(eq(reviewTvSeriesComment.id, parent.id));
    expect(updatedParent.repliesCount).toBe(0);
  });
});
