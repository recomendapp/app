import { z } from 'zod';

export const recoSendRouteParamsSchema = z.object({
  type: z.enum(['movie', 'tv_series']),
  id: z.coerce.number().int().positive(),
});

export type RecoSendRouteParams = z.infer<typeof recoSendRouteParamsSchema>;

export const recoSendSearchParamsSchema = z.object({
  mediaTitle: z.string().optional(),
});
