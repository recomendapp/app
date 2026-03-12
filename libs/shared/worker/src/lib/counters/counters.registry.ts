import { z } from 'zod';
import { PrefixRegistry, createPrefixedRegistry } from "../utils";
import { 
  UpdateFollowCountsSchema, 
  UpdatePlaylistItemsSchema, 
  UpdatePlaylistLikesSchema, 
  UpdatePlaylistSavesSchema, 
  UpdateReviewMovieLikesSchema, 
  UpdateReviewTvSeriesLikesSchema 
} from "./counters.dto";

export const COUNTERS_QUEUE = 'counters_queue';
export const COUNTERS_PATH = 'counters';

const BaseCountersSchemas = {
  'update-follow': UpdateFollowCountsSchema,
  'update-review-movie-likes': UpdateReviewMovieLikesSchema,
  'update-review-tv-series-likes': UpdateReviewTvSeriesLikesSchema,
  'update-playlist-items': UpdatePlaylistItemsSchema,
  'update-playlist-likes': UpdatePlaylistLikesSchema,
  'update-playlist-saves': UpdatePlaylistSavesSchema,
} as const;

export const CountersSchemas = createPrefixedRegistry(COUNTERS_PATH, BaseCountersSchemas);

type BaseCountersRegistry = {
  [K in keyof typeof BaseCountersSchemas]: z.input<typeof BaseCountersSchemas[K]>;
};

export type CountersRegistry = PrefixRegistry<typeof COUNTERS_PATH, BaseCountersRegistry>;