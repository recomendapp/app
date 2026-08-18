import { useMutation } from '@tanstack/react-query';
import {
  movieLogsControllerDeleteMutation,
  movieLogsControllerSetMutation,
  movieReviewsControllerDeleteMutation,
  movieReviewsControllerUpsertMutation,
  movieWatchedDatesControllerDeleteMutation,
  movieWatchedDatesControllerSetMutation,
  movieWatchedDatesControllerUpdateMutation,
} from '@libs/api-js';

/* ---------------------------------- Logs ---------------------------------- */
export const useMovieLogSetMutation = () => {
  return useMutation({
    ...movieLogsControllerSetMutation(),
  });
};

export const useMovieLogDeleteMutation = () => {
  return useMutation({
    ...movieLogsControllerDeleteMutation(),
  });
};

// Watched dates
export const useMovieWatchedDateSetMutation = () => {
  return useMutation({
    ...movieWatchedDatesControllerSetMutation(),
  });
};

export const useMovieWatchedDateUpdateMutation = () => {
  return useMutation({
    ...movieWatchedDatesControllerUpdateMutation(),
  });
};

export const useMovieWatchedDateDeleteMutation = () => {
  return useMutation({
    ...movieWatchedDatesControllerDeleteMutation(),
  });
};

/* --------------------------------- Reviews -------------------------------- */
export const useMovieReviewUpsertMutation = () => {
  return useMutation({
    ...movieReviewsControllerUpsertMutation(),
  });
};

export const useMovieReviewDeleteMutation = () => {
  return useMutation({
    ...movieReviewsControllerDeleteMutation(),
  });
};
