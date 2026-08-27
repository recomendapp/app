import { z } from 'zod';
import { getIdFromSlug } from '@/utils/get-id-from-slug';

export const personDetailsRouteParamsSchema = z.object({
  // "person_id" is actually a slug (e.g. "1387582-david-borenstein"), same as
  // on /person/[person_id]/page.tsx — extract the numeric id the same way.
  person_id: z.string().transform((slug, ctx) => {
    const { id } = getIdFromSlug(slug);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid person id' });
      return z.NEVER;
    }
    return id;
  }),
});

export type PersonDetailsRouteParams = z.infer<typeof personDetailsRouteParamsSchema>;
