import { tmdbMovieView } from "../schemas";

export const MOVIE_COMPACT_SELECT = {
  id: tmdbMovieView.id,
  title: tmdbMovieView.title,
  slug: tmdbMovieView.slug,
  url: tmdbMovieView.url,
  posterPath: tmdbMovieView.posterPath,
  backdropPath: tmdbMovieView.backdropPath,
  directors: tmdbMovieView.directors,
  releaseDate: tmdbMovieView.releaseDate,
  voteAverage: tmdbMovieView.voteAverage,
  voteCount: tmdbMovieView.voteCount,
  popularity: tmdbMovieView.popularity,
  genres: tmdbMovieView.genres,
  followerAvgRating: tmdbMovieView.followerAvgRating,
};