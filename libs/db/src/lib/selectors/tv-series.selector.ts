import { tmdbTvSeriesView } from "../schemas";

export const TV_SERIES_COMPACT_SELECT = {
  id: tmdbTvSeriesView.id,
  name: tmdbTvSeriesView.name,
  slug: tmdbTvSeriesView.slug,
  url: tmdbTvSeriesView.url,
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