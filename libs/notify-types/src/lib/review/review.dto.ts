import { z } from 'zod';

const MediaTypeSchema = z.enum(['movie', 'tv_series']);

export const NotifyReviewLikedSchema = z.object({
  actorId: z.uuid(),
  targetUserId: z.uuid(),
  reviewAuthorId: z.uuid(),
  reviewId: z.number().int().positive(),
  mediaId: z.number().int().positive(),
  mediaType: MediaTypeSchema,
});
export type NotifyReviewLikedDto = z.infer<typeof NotifyReviewLikedSchema>;

export const NotifyReviewCommentedSchema = z.object({
  actorId: z.uuid(),
  targetUserId: z.uuid(),
  reviewAuthorId: z.uuid(),
  reviewId: z.number().int().positive(),
  commentId: z.number().int().positive(),
  mediaId: z.number().int().positive(),
  mediaType: MediaTypeSchema,
  comment: z.string(),
});
export type NotifyReviewCommentedDto = z.infer<typeof NotifyReviewCommentedSchema>;

export const NotifyReviewCommentLikedSchema = z.object({
  actorId: z.uuid(),
  targetUserId: z.uuid(),
  reviewAuthorId: z.uuid(),
  reviewId: z.number().int().positive(),
  commentId: z.number().int().positive(),
  mediaId: z.number().int().positive(),
  mediaType: MediaTypeSchema,
});
export type NotifyReviewCommentLikedDto = z.infer<typeof NotifyReviewCommentLikedSchema>;

export const NotifyReviewCommentRepliedSchema = z.object({
  actorId: z.uuid(),
  targetUserId: z.uuid(),
  reviewAuthorId: z.uuid(),
  reviewId: z.number().int().positive(),
  commentId: z.number().int().positive(),
  parentCommentId: z.number().int().positive(),
  mediaId: z.number().int().positive(),
  mediaType: MediaTypeSchema,
  comment: z.string(),
});
export type NotifyReviewCommentRepliedDto = z.infer<typeof NotifyReviewCommentRepliedSchema>;
