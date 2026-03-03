import { z } from 'zod';

export const action = z.enum(['increment', 'decrement']);

export const UpdateFollowCountsSchema = z.object({
	followerId: z.uuid(),
	followingId: z.uuid(),
	action,
});
export type UpdateFollowCountsDto = z.infer<typeof UpdateFollowCountsSchema>;

export const UpdateReviewMovieLikesSchema = z.object({
	reviewId: z.number().int().positive(),
	action,
});
export type UpdateReviewMovieLikesDto = z.infer<typeof UpdateReviewMovieLikesSchema>;

export const UpdateReviewTvSeriesLikesSchema = z.object({
	reviewId: z.number().int().positive(),
	action,
});
export type UpdateReviewTvSeriesLikesDto = z.infer<typeof UpdateReviewTvSeriesLikesSchema>;

export const UpdatePlaylistLikesSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
});
export type UpdatePlaylistLikesDto = z.infer<typeof UpdatePlaylistLikesSchema>;

export const UpdatePlaylistSavesSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
});
export type UpdatePlaylistSavesDto = z.infer<typeof UpdatePlaylistSavesSchema>;