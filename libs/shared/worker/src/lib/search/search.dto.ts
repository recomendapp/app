import { z } from 'zod';

export const searchAction = z.enum(['upsert', 'delete']);

export const SyncUserSchema = z.object({
	userId: z.uuid(),
	action: searchAction,
});

export const SyncPlaylistSchema = z.object({
	playlistId: z.number().int().positive(),
	action: searchAction,
});
