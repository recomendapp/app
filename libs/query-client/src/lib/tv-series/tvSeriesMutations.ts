import {
  tvSeriesLogsControllerDeleteMutation,
  tvSeriesLogsControllerSetMutation,
  tvSeriesReviewsControllerDeleteMutation,
  tvSeriesReviewsControllerUpsertMutation,
} from '@libs/api-js';
import { useMutation } from '@tanstack/react-query';

export const useTvSeriesLogSetMutation = () => {
  return useMutation({
    ...tvSeriesLogsControllerSetMutation(),
  });
};

export const useTvSeriesLogDeleteMutation = () => {
  return useMutation({
    ...tvSeriesLogsControllerDeleteMutation(),
  });
};

/* --------------------------------- Reviews -------------------------------- */
export const useTvSeriesReviewUpsertMutation = () => {
  return useMutation({
    ...tvSeriesReviewsControllerUpsertMutation(),
  });
};

export const useTvSeriesReviewDeleteMutation = () => {
  return useMutation({
    ...tvSeriesReviewsControllerDeleteMutation(),
  });
};
