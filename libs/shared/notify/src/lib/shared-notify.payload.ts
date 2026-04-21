import { z } from 'zod';
import { NotifyRecoRegistry } from './reco/reco.registry';
import { NotifyFollowRegistry } from './follow/follow.registry';

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
    };