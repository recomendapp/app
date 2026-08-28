import { z } from 'zod';

export const playlistMembersAddRouteParamsSchema = z.object({
  playlist_id: z.coerce.number().int().positive(),
});

export type PlaylistMembersAddRouteParams = z.infer<typeof playlistMembersAddRouteParamsSchema>;
