import { z } from 'zod';

export const playlistMembersRouteParamsSchema = z.object({
  playlist_id: z.coerce.number().int().positive(),
});

export type PlaylistMembersRouteParams = z.infer<typeof playlistMembersRouteParamsSchema>;
