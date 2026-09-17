import { z } from 'zod';
import { NotifyFollowRegistry } from './follow';
import { NotifyRecoRegistry } from './reco';
import { NotifyReviewRegistry } from './review';

const MediaTypeSchema = z.enum(['movie', 'tv_series']);
type MediaType = z.infer<typeof MediaTypeSchema>;

export type PushNotificationPayload =
  // Follows
  | {
      type: keyof NotifyFollowRegistry;
      url: string;
      actorId: string;
      actorUsername: string;
    }
  // Recos
  | {
      type: keyof NotifyRecoRegistry;
      url: string;
      mediaId: string;
      mediaType: MediaType;
    }
  // Reviews (likes + comments, on the review itself or on a comment)
  | {
      type: keyof NotifyReviewRegistry;
      url: string;
      mediaId: string;
      mediaType: MediaType;
      // Username of the review's author — the mobile comments route is
      // scoped under their profile regardless of who the recipient is.
      reviewAuthorUsername: string;
    };
