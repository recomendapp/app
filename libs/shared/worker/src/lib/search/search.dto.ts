import { z } from 'zod';

export const SyncUserSchema = z.object({
	userId: z.uuid(),
});

export const SyncPlaylistSchema = z.object({
	playlistId: z.string(),
});
