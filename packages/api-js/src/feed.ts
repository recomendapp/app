import { FeedItemLogMovie, FeedItemLogTvSeries, FeedItemPlaylistLike, FeedItemReviewMovieLike, FeedItemReviewTvSeriesLike } from "./__generated__";

export type FeedItem = (
	| ({ activityType: 'log_movie' } & FeedItemLogMovie)
	| ({ activityType: 'log_tv_series' } & FeedItemLogTvSeries)
	| ({ activityType: 'playlist_like' } & FeedItemPlaylistLike)
	| ({ activityType: 'review_movie_like' } & FeedItemReviewMovieLike)
	| ({ activityType: 'review_tv_series_like' } & FeedItemReviewTvSeriesLike)
);
