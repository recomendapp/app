import { tmdbTvSeriesView } from '../schemas';

export const TV_SERIES_COMPACT_SELECT = {
  id: tmdbTvSeriesView.id,
  name: tmdbTvSeriesView.name,
  posterPath: tmdbTvSeriesView.posterPath,
  backdropPath: tmdbTvSeriesView.backdropPath,
  createdBy: tmdbTvSeriesView.createdBy,
  firstAirDate: tmdbTvSeriesView.firstAirDate,
  lastAirDate: tmdbTvSeriesView.lastAirDate,
  voteAverage: tmdbTvSeriesView.voteAverage,
  voteCount: tmdbTvSeriesView.voteCount,
  popularity: tmdbTvSeriesView.popularity,
  genres: tmdbTvSeriesView.genres,
  followerAvgRating: tmdbTvSeriesView.followerAvgRating,
};

export const TV_SERIES_SUMMARY_SELECT = {
  id: tmdbTvSeriesView.id,
  name: tmdbTvSeriesView.name,
  overview: tmdbTvSeriesView.overview,
  posterPath: tmdbTvSeriesView.posterPath,
  backdropPath: tmdbTvSeriesView.backdropPath,
  createdBy: tmdbTvSeriesView.createdBy,
  firstAirDate: tmdbTvSeriesView.firstAirDate,
  lastAirDate: tmdbTvSeriesView.lastAirDate,
  voteAverage: tmdbTvSeriesView.voteAverage,
  voteCount: tmdbTvSeriesView.voteCount,
  popularity: tmdbTvSeriesView.popularity,
  genres: tmdbTvSeriesView.genres,
  followerAvgRating: tmdbTvSeriesView.followerAvgRating,
};
