import { z } from 'zod';
import { NotifyFollowRegistry } from './follow';
import { NotifyRecoRegistry } from './reco';

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