import { z } from 'zod';

export const NotifyFollowNewSchema = z.object({
  actorId: z.uuid(),
  targetUserId: z.uuid(),
});
export type NotifyFollowNewDto = z.infer<typeof NotifyFollowNewSchema>;

export const NotifyFollowRequestSchema = z.object({
  actorId: z.uuid(),
  targetUserId: z.uuid(),
});
export type NotifyFollowRequestDto = z.infer<typeof NotifyFollowRequestSchema>;

export const NotifyFollowAcceptedSchema = z.object({
  actorId: z.uuid(),
  targetUserId: z.uuid(),
});
export type NotifyFollowAcceptedDto = z.infer<typeof NotifyFollowAcceptedSchema>;