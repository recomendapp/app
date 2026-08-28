import { z } from 'zod';

export const playlistEditRouteParamsSchema = z.object({
  playlist_id: z.coerce.number().int().positive(),
});

export type PlaylistEditRouteParams = z.infer<typeof playlistEditRouteParamsSchema>;
