import {
  tvSeasonLogsControllerDeleteMutation,
  tvSeasonLogsControllerSetMutation,
} from '@libs/api-js';
import { useMutation } from '@tanstack/react-query';

export const useTvSeasonLogSetMutation = () => {
  return useMutation({
    ...tvSeasonLogsControllerSetMutation(),
  });
};

export const useTvSeasonLogDeleteMutation = () => {
  return useMutation({
    ...tvSeasonLogsControllerDeleteMutation(),
  });
};
