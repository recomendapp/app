import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bookmarksControllerDeleteByMediaMutation,
  bookmarksControllerSetByMediaMutation,
  personsControllerFollowMutation,
  personsControllerUnfollowMutation,
  playlistLikesControllerDeleteMutation,
  playlistLikesControllerSetMutation,
  playlistSavesControllerDeleteMutation,
  playlistSavesControllerSetMutation,
  recosControllerDeleteByIdMutation,
  recosControllerDeleteByMediaMutation,
  recosControllerSendMutation,
  userFollowControllerAcceptMutation,
  userFollowControllerDeclineMutation,
  userFollowControllerDeleteMutation,
  userFollowControllerSetMutation,
} from '@libs/api-js';
import {
  userPersonFollowOptions,
  userPlaylistLikeOptions,
  userPlaylistSavedOptions,
} from './userOptions';

/* ---------------------------------- Recos --------------------------------- */
export const useUserRecoSendMutation = () => {
  return useMutation({
    ...recosControllerSendMutation(),
  });
};

export const useUserRecoDeleteByMediaMutation = () => {
  return useMutation({
    ...recosControllerDeleteByMediaMutation(),
  });
};
export const useUserRecoDeleteByIdMutation = () => {
  return useMutation({
    ...recosControllerDeleteByIdMutation(),
  });
};

/* -------------------------------- Bookmarks ------------------------------- */
export const useUserBookmarkSetByMediaMutation = () => {
  return useMutation({
    ...bookmarksControllerSetByMediaMutation(),
  });
};

export const useUserBookmarkDeleteByMediaMutation = () => {
  return useMutation({
    ...bookmarksControllerDeleteByMediaMutation(),
  });
};

/* --------------------------------- Follows -------------------------------- */
export const useUserFollowMutation = () => {
  return useMutation({
    ...userFollowControllerSetMutation(),
  });
};

export const useUserUnfollowMutation = () => {
  return useMutation({
    ...userFollowControllerDeleteMutation(),
  });
};

export const useUserPersonFollowMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...personsControllerFollowMutation(),
    onMutate: async ({ path: { person_id } }) => {
      const options = userPersonFollowOptions({ userId: userId, personId: person_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, true);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { person_id },
        } = _variables;
        const options = userPersonFollowOptions({ userId: userId, personId: person_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
  });
};

export const useUserPersonUnfollowMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...personsControllerUnfollowMutation(),
    onMutate: async ({ path: { person_id } }) => {
      const options = userPersonFollowOptions({ userId: userId, personId: person_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, false);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { person_id },
        } = _variables;
        const options = userPersonFollowOptions({ userId: userId, personId: person_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
  });
};

export const useUserAcceptFollowMutation = () => {
  return useMutation({
    ...userFollowControllerAcceptMutation(),
  });
};

export const useUserDeclineFollowMutation = () => {
  return useMutation({
    ...userFollowControllerDeclineMutation(),
  });
};

/* -------------------------------- Playlists ------------------------------- */

// Like
export const useUserPlaylistLikeMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...playlistLikesControllerSetMutation(),
    onMutate: async ({ path: { playlist_id } }) => {
      const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, true);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { playlist_id },
        } = _variables;
        const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
  });
};
export const useUserPlaylistUnlikeMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...playlistLikesControllerDeleteMutation(),
    onMutate: async ({ path: { playlist_id } }) => {
      const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, false);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { playlist_id },
        } = _variables;
        const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
  });
};

// Save
export const useUserPlaylistSaveMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...playlistSavesControllerSetMutation(),
    onMutate: async ({ path: { playlist_id } }) => {
      const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, true);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { playlist_id },
        } = _variables;
        const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
  });
};
export const useUserPlaylistUnsaveMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...playlistSavesControllerDeleteMutation(),
    onMutate: async ({ path: { playlist_id } }) => {
      const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, false);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { playlist_id },
        } = _variables;
        const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
  });
};
