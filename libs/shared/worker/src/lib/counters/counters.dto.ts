import { z } from 'zod';

export const action = z.enum(['increment', 'decrement']);
export const amount = z.number().int().positive().default(1);

export const UpdateFollowCountsSchema = z.object({
	followerId: z.uuid(),
	followingId: z.uuid(),
	action,
	amount,
});

export const UpdateReviewMovieLikesSchema = z.object({
	reviewId: z.number().int().positive(),
	action,
	amount,
});

export const UpdateReviewTvSeriesLikesSchema = z.object({
	reviewId: z.number().int().positive(),
	action,
	amount,
});

export const UpdatePlaylistItemsSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
  amount,
});

export const UpdatePlaylistLikesSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
  amount,
});

export const UpdatePlaylistSavesSchema = z.object({
  playlistId: z.number().int().positive(),
  action,
  amount,
});