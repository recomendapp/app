import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bookmarksControllerDeleteByMediaMutation,
  bookmarksControllerSetByMediaMutation,
  FollowRequest,
  ListInfiniteFollowRequests,
  ListInfiniteUsers,
  ListPaginatedFollowRequests,
  ListPaginatedUsers,
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
  UserSummary,
  Playlist,
  ListPaginatedPlaylists,
  ListInfinitePlaylists,
  ListPaginatedPersonFeed,
  ListInfinitePersonFeed,
  PersonFeedWithMovie,
  PersonFeedWithTvSeries,
  FeedItem,
  ListPaginatedFeed,
  ListInfiniteFeed,
} from '@libs/api-js';
import {
  userFeedInfiniteOptions,
  userFeedPaginatedOptions,
  userFeedPersonsInfiniteOptions,
  userFeedPersonsPaginatedOptions,
  userFollowersInfiniteOptions,
  userFollowersPaginatedOptions,
  userFollowingInfiniteOptions,
  userFollowingPaginatedOptions,
  userFollowOptions,
  userFollowRequestsInfiniteOptions,
  userFollowRequestsPaginatedOptions,
  userPersonFollowOptions,
  userPlaylistLikeOptions,
  userPlaylistSavedOptions,
  userPlaylistsSavedInfiniteOptions,
  userPlaylistsSavedPaginatedOptions,
} from './userOptions';
import { removeListItemFromAllCaches } from '../utils';
import { userKeys } from './userKeys';
import { meFeedInfiniteOptions, meFeedPaginatedOptions } from '../query-client';

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
  const queryClient = useQueryClient();
  return useMutation({
    ...userFollowControllerSetMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        userFollowOptions({
          userId: data.followerId,
          profileId: data.followingId,
        }).queryKey,
        data,
      );

      queryClient.invalidateQueries({
        queryKey: userKeys.followers({
          userId: data.followingId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: userKeys.following({
          userId: data.followerId,
        }),
      });

      // TODO: Invalidate feed queries
    },
  });
};

export const useUserUnfollowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...userFollowControllerDeleteMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        userFollowOptions({
          userId: data.followerId,
          profileId: data.followingId,
        }).queryKey,
        null,
      );

      if (data.status === 'accepted') {
        removeListItemFromAllCaches<UserSummary, ListPaginatedUsers, ListInfiniteUsers>(
          queryClient,
          {
            paginated: userFollowingPaginatedOptions({ profileId: data.followerId }).queryKey,
            infinite: userFollowingInfiniteOptions({ profileId: data.followerId }).queryKey,
          },
          (item) => item.id === data.followingId,
        );
        removeListItemFromAllCaches<UserSummary, ListPaginatedUsers, ListInfiniteUsers>(
          queryClient,
          {
            paginated: userFollowersPaginatedOptions({ profileId: data.followingId }).queryKey,
            infinite: userFollowersInfiniteOptions({ profileId: data.followingId }).queryKey,
          },
          (item) => item.id === data.followerId,
        );
      }
    },
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.feedPersons({
          userId: data.userId,
        }),
      });
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
    onSuccess: (data) => {
      removeListItemFromAllCaches<
        | ({
            type: 'movie';
          } & PersonFeedWithMovie)
        | ({
            type: 'tv_series';
          } & PersonFeedWithTvSeries),
        ListPaginatedPersonFeed,
        ListInfinitePersonFeed
      >(
        queryClient,
        {
          paginated: userFeedPersonsPaginatedOptions({ userId: data.userId }).queryKey,
          infinite: userFeedPersonsInfiniteOptions({ userId: data.userId }).queryKey,
        },
        (item) => item.person.id === data.personId,
      );
    },
  });
};

export const useUserAcceptFollowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...userFollowControllerAcceptMutation(),
    onSuccess: (data) => {
      removeListItemFromAllCaches<
        FollowRequest,
        ListPaginatedFollowRequests,
        ListInfiniteFollowRequests
      >(
        queryClient,
        {
          paginated: userFollowRequestsPaginatedOptions({ userId: data.followingId }).queryKey,
          infinite: userFollowRequestsInfiniteOptions({ userId: data.followingId }).queryKey,
        },
        (item) => item.user.id === data.followerId,
      );

      queryClient.invalidateQueries({
        queryKey: userKeys.followers({
          userId: data.followingId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: userKeys.following({
          userId: data.followerId,
        }),
      });
    },
  });
};

export const useUserDeclineFollowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...userFollowControllerDeclineMutation(),
    onSuccess: (data) => {
      removeListItemFromAllCaches<
        FollowRequest,
        ListPaginatedFollowRequests,
        ListInfiniteFollowRequests
      >(
        queryClient,
        {
          paginated: userFollowRequestsPaginatedOptions({ userId: data.followingId }).queryKey,
          infinite: userFollowRequestsInfiniteOptions({ userId: data.followingId }).queryKey,
        },
        (item) => item.user.id === data.followerId,
      );
    },
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
    onSuccess: (data) => {
      queryClient.setQueryData(
        userPlaylistLikeOptions({
          userId: data.userId,
          playlistId: data.playlistId,
        }).queryKey,
        true,
      );

      queryClient.invalidateQueries({ queryKey: userKeys.feed({ userId: data.userId }) });
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
    onSuccess: (data) => {
      queryClient.setQueryData(
        userPlaylistLikeOptions({
          userId: data.userId,
          playlistId: data.playlistId,
        }).queryKey,
        false,
      );

      removeListItemFromAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: meFeedPaginatedOptions({ userId: data.userId }).queryKey,
          infinite: meFeedInfiniteOptions({ userId: data.userId }).queryKey,
        },
        (old: FeedItem) =>
          old.activityType === 'playlist_like' &&
          old.content.id === data.playlistId &&
          old.author.id === data.userId,
      );
      removeListItemFromAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: userFeedPaginatedOptions({ userId: data.userId }).queryKey,
          infinite: userFeedInfiniteOptions({ userId: data.userId }).queryKey,
        },
        (old: FeedItem) =>
          old.activityType === 'playlist_like' &&
          old.content.id === data.playlistId &&
          old.author.id === data.userId,
      );
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
    onSuccess: (data) => {
      queryClient.setQueryData(
        userPlaylistSavedOptions({
          userId: data.userId,
          playlistId: data.playlistId,
        }).queryKey,
        true,
      );

      queryClient.invalidateQueries({ queryKey: userKeys.playlistsSaved({ userId: data.userId }) });
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
    onSuccess: (data) => {
      queryClient.setQueryData(
        userPlaylistSavedOptions({
          userId: data.userId,
          playlistId: data.playlistId,
        }).queryKey,
        false,
      );

      removeListItemFromAllCaches<Playlist, ListPaginatedPlaylists, ListInfinitePlaylists>(
        queryClient,
        {
          paginated: userPlaylistsSavedPaginatedOptions({ userId: data.userId }).queryKey,
          infinite: userPlaylistsSavedInfiniteOptions({ userId: data.userId }).queryKey,
        },
        (item) => item.id === data.playlistId,
      );
    },
  });
};
