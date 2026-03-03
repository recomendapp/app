import { z } from 'zod';

export const SyncUserSchema = z.object({
	userId: z.uuid(),
});
export type SyncUserDto = z.infer<typeof SyncUserSchema>;

export const SyncPlaylistSchema = z.object({
	playlistId: z.string(),
});
export type SyncPlaylistDto = z.infer<typeof SyncPlaylistSchema>;
