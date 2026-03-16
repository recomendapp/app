import { z } from 'zod';
import { PrefixRegistry, createPrefixedRegistry } from "../utils";
import {
    InsertFeedActivitySchema,
    DeleteFeedActivitySchema,
} from "./feed.dto";

export const FEED_QUEUE = 'feed_queue';
export const FEED_PATH = 'feed';

const BaseFeedSchemas = {
    'insert-activity': InsertFeedActivitySchema,
    'delete-activity': DeleteFeedActivitySchema,
} as const;

export const FeedSchemas = createPrefixedRegistry(FEED_PATH, BaseFeedSchemas);

type BaseFeedRegistry = {
  [K in keyof typeof BaseFeedSchemas]: z.input<typeof BaseFeedSchemas[K]>;
};

export type FeedRegistry = PrefixRegistry<typeof FEED_PATH, BaseFeedRegistry>;