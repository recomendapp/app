import { tmdbMovieView } from '../schemas';

export const MOVIE_COMPACT_SELECT = {
  id: tmdbMovieView.id,
  title: tmdbMovieView.title,
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

export const MOVIE_SUMMARY_SELECT = {
  id: tmdbMovieView.id,
  title: tmdbMovieView.title,
  overview: tmdbMovieView.overview,
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
