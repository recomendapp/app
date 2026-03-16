import { z } from 'zod';
import { feedTypeEnum } from '@libs/db/schemas';

export const FeedActivityTypeSchema = z.enum(feedTypeEnum.enumValues);

export const InsertFeedActivitySchema = z.object({
  userId: z.uuid(),
  activityType: FeedActivityTypeSchema,
  activityId: z.number(), 
});

export const DeleteFeedActivitySchema = z.object({
  activityType: FeedActivityTypeSchema,
  activityId: z.number(),
});