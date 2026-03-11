import { z } from 'zod';

export const action = z.enum(['increment', 'decrement']);
export const amount = z.number().int().positive().default(1);

export const UpdateFollowCountsSchema = z.object({
	followerId: z.uuid(),
	followingId: z.uuid(),
	action,
	amount,
});
export type UpdateFollowCountsDto = z.input<typeof UpdateFollowCountsSchema>;

export const UpdateReviewMovieLikesSchema = z.object({
	reviewId: z.number().int().positive(),
	action,
	amount,
});
export type UpdateReviewMovieLikesDto = z.input<typeof UpdateReviewMovieLikesSchema>;

export const UpdateReviewTvSeriesLikesSchema = z.object({
	reviewId: z.number().int().positive(),
	action,
	amount,
});
export type UpdateReviewTvSeriesLikesDto = z.input<typeof UpdateReviewTvSeriesLikesSchema>;

export const UpdatePlaylistItemsSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
  amount,
});
export type UpdatePlaylistItemsDto = z.input<typeof UpdatePlaylistItemsSchema>;

export const UpdatePlaylistLikesSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
  amount,
});
export type UpdatePlaylistLikesDto = z.input<typeof UpdatePlaylistLikesSchema>;

export const UpdatePlaylistSavesSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
  amount,
});
export type UpdatePlaylistSavesDto = z.input<typeof UpdatePlaylistSavesSchema>;