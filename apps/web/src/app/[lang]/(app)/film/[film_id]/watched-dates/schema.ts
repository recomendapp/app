import { z } from 'zod';
import { getIdFromSlug } from '@/utils/get-id-from-slug';

export const movieWatchedDatesRouteParamsSchema = z.object({
  // "film_id" is actually a slug (e.g. "603-the-matrix"), same as on
  // /film/[film_id]/page.tsx — extract the numeric id the same way.
  film_id: z.string().transform((slug, ctx) => {
    const { id } = getIdFromSlug(slug);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid movie id' });
      return z.NEVER;
    }
    return id;
  }),
});

export type MovieWatchedDatesRouteParams = z.infer<typeof movieWatchedDatesRouteParamsSchema>;
