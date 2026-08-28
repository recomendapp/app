import { z } from 'zod';

export const playlistAddRouteParamsSchema = z.object({
  type: z.enum(['movie', 'tv_series']),
  id: z.coerce.number().int().positive(),
});

export type PlaylistAddRouteParams = z.infer<typeof playlistAddRouteParamsSchema>;

export const playlistAddSearchParamsSchema = z.object({
  mediaTitle: z.string().optional(),
});
