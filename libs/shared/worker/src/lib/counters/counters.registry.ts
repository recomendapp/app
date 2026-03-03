import { PrefixRegistry } from "../utils";
import { UpdateFollowCountsDto, UpdatePlaylistLikesDto, UpdatePlaylistSavesDto, UpdateReviewMovieLikesDto, UpdateReviewTvSeriesLikesDto } from "./counters.dto";

export const COUNTERS_QUEUE = 'counters_queue';
export const COUNTERS_PATH = 'counters';

type BaseCountersRegistry = {
  'update-follow': UpdateFollowCountsDto;
  'update-review-movie-likes': UpdateReviewMovieLikesDto;
  'update-review-tv-series-likes': UpdateReviewTvSeriesLikesDto;
  'update-playlist-likes': UpdatePlaylistLikesDto;
  'update-playlist-saves': UpdatePlaylistSavesDto;
};

export type CountersRegistry = PrefixRegistry<typeof COUNTERS_PATH, BaseCountersRegistry>;