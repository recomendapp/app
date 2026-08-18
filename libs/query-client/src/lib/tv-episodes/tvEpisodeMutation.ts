import {
  tvEpisodeLogsControllerDeleteMutation,
  tvEpisodeLogsControllerSetMutation,
} from '@libs/api-js';
import { useMutation } from '@tanstack/react-query';

export const useTvEpisodeLogSetMutation = () => {
  return useMutation({
    ...tvEpisodeLogsControllerSetMutation(),
  });
};

export const useTvEpisodeLogDeleteMutation = () => {
  return useMutation({
    ...tvEpisodeLogsControllerDeleteMutation(),
  });
};
