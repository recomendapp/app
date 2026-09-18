import {
  NotifyReviewCommentedSchema,
  NotifyReviewCommentRepliedSchema,
  NotifyReviewLikedSchema,
} from './review.dto';

const validUuid = '3f6b6a2e-6d8b-4b3a-9f0e-2a2b7e6c9d1a';

describe('NotifyReviewLikedSchema', () => {
  const valid = {
    actorId: validUuid,
    targetUserId: validUuid,
    reviewAuthorId: validUuid,
    reviewId: 1,
    mediaId: 1,
    mediaType: 'movie' as const,
  };

  it('accepts a valid payload', () => {
    expect(NotifyReviewLikedSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a non-positive reviewId', () => {
    expect(NotifyReviewLikedSchema.safeParse({ ...valid, reviewId: 0 }).success).toBe(false);
  });
});

describe('NotifyReviewCommentedSchema', () => {
  const valid = {
    actorId: validUuid,
    targetUserId: validUuid,
    reviewAuthorId: validUuid,
    reviewId: 1,
    commentId: 1,
    mediaId: 1,
    mediaType: 'movie' as const,
    comment: 'Nice review!',
  };

  it('accepts a valid payload', () => {
    expect(NotifyReviewCommentedSchema.safeParse(valid).success).toBe(true);
  });

  it('requires the comment field (unlike the reco DTOs, it is not optional/nullable here)', () => {
    const { comment, ...rest } = valid;
    expect(NotifyReviewCommentedSchema.safeParse(rest).success).toBe(false);
  });
});

describe('NotifyReviewCommentRepliedSchema', () => {
  const valid = {
    actorId: validUuid,
    targetUserId: validUuid,
    reviewAuthorId: validUuid,
    reviewId: 1,
    commentId: 2,
    parentCommentId: 1,
    mediaId: 1,
    mediaType: 'tv_series' as const,
    comment: 'Totally agree!',
  };

  it('accepts a valid payload', () => {
    expect(NotifyReviewCommentRepliedSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a missing parentCommentId', () => {
    const { parentCommentId, ...rest } = valid;
    expect(NotifyReviewCommentRepliedSchema.safeParse(rest).success).toBe(false);
  });
});
