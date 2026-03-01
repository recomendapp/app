import { z } from 'zod';

const MediaTypeSchema = z.enum(['movie', 'tv_series']);

export const NotifyRecoReceivedSchema = z.object({
  senderId: z.uuid(),
  receiverIds: z.array(z.uuid()),
  mediaId: z.number().int().positive(),
  type: MediaTypeSchema,
  comment: z.string().nullable().optional(),
});
export type NotifyRecoReceivedDto = z.infer<typeof NotifyRecoReceivedSchema>;

export const NotifyRecoCompletedSchema = z.object({
  userId: z.uuid(),
  senderIds: z.array(z.uuid()),
  mediaId: z.number().int().positive(),
  type: MediaTypeSchema,
});
export type NotifyRecoCompletedDto = z.infer<typeof NotifyRecoCompletedSchema>;