import { useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  BookmarkWithMedia,
  FeedItem,
  Follow,
  FollowRequest,
  ListInfiniteBookmarks,
  ListInfiniteFeed,
  ListInfiniteFollowRequests,
  ListInfinitePersonFeed,
  ListInfiniteRecos,
  ListInfiniteRecoTargets,
  ListInfiniteUsers,
  ListPaginatedBookmarks,
  ListPaginatedFeed,
  ListPaginatedFollowRequests,
  ListPaginatedPersonFeed,
  ListPaginatedRecos,
  ListPaginatedRecoTargets,
  ListPaginatedUsers,
  PersonFeedWithMovie,
  PersonFeedWithTvSeries,
  ListInfinitePlaylists,
  ListPaginatedPlaylists,
  PersonFollow,
  PinnedItemWithData,
  Playlist,
  PlaylistLike,
  PlaylistSaved,
  Profile,
  Reco,
  RecoSendResponse,
  RecoTarget,
  RecoWithMedia,
  User,
  UserSummary,
} from '@libs/api-js';
import {
  resolveUpdater,
  ItemUpdater,
  removeListItemFromAllCaches,
  updateListItemInAllCaches,
  updateOrRemoveListItemInAllCaches,
} from '../utils';
import {
  userByIdOptions,
  userByUsernameOptions,
  userBookmarkByMediaOptions,
  userBookmarksAllOptions,
  userRecoSendAllOptions,
  userRecoSendPaginatedOptions,
  userRecoSendInfiniteOptions,
  userRecosAllOptions,
  userFollowOptions,
  userFollowersPaginatedOptions,
  userFollowersInfiniteOptions,
  userFollowingPaginatedOptions,
  userFollowingInfiniteOptions,
  userFollowRequestsPaginatedOptions,
  userFollowRequestsInfiniteOptions,
  userPersonFollowOptions,
  userFeedPersonsPaginatedOptions,
  userFeedPersonsInfiniteOptions,
  userPlaylistLikeOptions,
  userPlaylistSavedOptions,
  userPlaylistsSavedPaginatedOptions,
  userPlaylistsSavedInfiniteOptions,
  userFeedPaginatedOptions,
  userFeedInfiniteOptions,
  userPinnedOptions,
  userKeys,
} from '../users';
import { meOptions, meFeedPaginatedOptions, meFeedInfiniteOptions } from '../me';
import { useCallback } from 'react';

export const useUserCacheUpdate = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (user: User, updater: ItemUpdater<User | Profile>) => {
      queryClient.setQueryData(meOptions().queryKey, (old) => {
        if (!old || old.id !== user.id) return old;
        return {
          ...old,
          ...resolveUpdater(old, updater),
        };
      });

      queryClient.setQueryData(userByIdOptions({ userId: user.id }).queryKey, (old) => {
        if (!old) return undefined;
        return {
          ...old,
          ...resolveUpdater(old, updater),
        };
      });

      queryClient.setQueryData(
        userByUsernameOptions({ username: user.username }).queryKey,
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            ...resolveUpdater(old, updater),
          };
        },
      );
    },
    [queryClient],
  );
};

export const useBookmarkCacheUpdate = () => {
  const queryClient = useQueryClient();

  const setBookmark = useCallback(
    (data: BookmarkWithMedia) => {
      queryClient.setQueryData(
        userBookmarkByMediaOptions({
          userId: data.userId,
          mediaId: data.mediaId,
          type: data.type,
        }).queryKey,
        data,
      );

      const isInsert = data.createdAt === data.updatedAt;
      if (isInsert) {
        // The unfiltered "all" cache (the main watchlist view) can be patched directly since
        // we already have the full item with media — no need to wait on a refetch for it.
        queryClient.setQueryData(
          userBookmarksAllOptions({ userId: data.userId }).queryKey,
          (old) => {
            if (!old) return old;
            if (old.some((item) => item.id === data.id)) return old;
            return [data, ...old];
          },
        );

        // Paginated/infinite ordering depends on the server — invalidate rather than guess
        // the insertion position. The unfiltered "all" cache was already patched above, so
        // it's deliberately excluded here to avoid an immediate redundant refetch of it.
        queryClient.invalidateQueries({
          queryKey: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
        });
        queryClient.invalidateQueries({
          queryKey: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
        });
      } else {
        updateListItemInAllCaches<BookmarkWithMedia, ListPaginatedBookmarks, ListInfiniteBookmarks>(
          queryClient,
          {
            all: userKeys.bookmarks({ userId: data.userId, mode: 'all' }),
            paginated: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
            infinite: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
          },
          data,
        );
      }
    },
    [queryClient],
  );

  const deleteBookmark = useCallback(
    (data: Bookmark) => {
      queryClient.setQueryData(
        userBookmarkByMediaOptions({
          userId: data.userId,
          mediaId: data.mediaId,
          type: data.type,
        }).queryKey,
        null,
      );

      removeListItemFromAllCaches<BookmarkWithMedia, ListPaginatedBookmarks, ListInfiniteBookmarks>(
        queryClient,
        {
          all: userKeys.bookmarks({ userId: data.userId, mode: 'all' }),
          paginated: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
          infinite: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
        },
        data.id,
      );
    },
    [queryClient],
  );

  return { setBookmark, deleteBookmark };
};

export const usePinnedCacheUpdate = () => {
  const queryClient = useQueryClient();

  const sortByRank = <T extends { rank: string }>(items: T[]) =>
    [...items].sort((a, b) => a.rank.localeCompare(b.rank));

  const setPinned = useCallback(
    (item: PinnedItemWithData) => {
      queryClient.setQueryData(userPinnedOptions({ userId: item.userId }).queryKey, (old) => {
        if (!old) return old;
        if (old.some((existing) => existing.id === item.id)) return old;
        return sortByRank([...old, item]);
      });
    },
    [queryClient],
  );

  type PinnedStatusSignal = {
    id: number;
    userId: string;
    rank: string;
    status: 'available' | 'unavailable' | 'over_limit';
  };

  const applyStatusSignals = (
    old: PinnedItemWithData[] | undefined,
    signals: PinnedStatusSignal[],
  ) => {
    if (!old) return old;
    const byId = new Map(signals.map((signal) => [signal.id, signal]));
    return sortByRank(
      old.map((item) => {
        const signal = byId.get(item.id);
        return signal ? { ...item, rank: signal.rank, status: signal.status } : item;
      }),
    );
  };

  const reorderPinned = useCallback(
    (signals: PinnedStatusSignal[]) => {
      const userId = signals[0]?.userId;
      if (!userId) return;
      queryClient.setQueryData(userPinnedOptions({ userId }).queryKey, (old) =>
        applyStatusSignals(old, signals),
      );
    },
    [queryClient],
  );

  const deletePinned = useCallback(
    (signal: { userId: string; deleted: number[]; updated: PinnedStatusSignal[] }) => {
      queryClient.setQueryData(userPinnedOptions({ userId: signal.userId }).queryKey, (old) => {
        if (!old) return old;
        const remaining = old.filter((item) => !signal.deleted.includes(item.id));
        return applyStatusSignals(remaining, signal.updated);
      });
    },
    [queryClient],
  );

  return { setPinned, reorderPinned, deletePinned };
};

export const useRecoTargetCacheUpdate = () => {
  const queryClient = useQueryClient();

  const markSent = useCallback(
    (data: RecoSendResponse) => {
      updateListItemInAllCaches<RecoTarget, ListPaginatedRecoTargets, ListInfiniteRecoTargets>(
        queryClient,
        {
          all: userRecoSendAllOptions({
            userId: data.senderId,
            mediaId: data.mediaId,
            mediaType: data.type,
          }).queryKey,
          paginated: userRecoSendPaginatedOptions({
            userId: data.senderId,
            mediaId: data.mediaId,
            mediaType: data.type,
          }).queryKey,
          infinite: userRecoSendInfiniteOptions({
            userId: data.senderId,
            mediaId: data.mediaId,
            mediaType: data.type,
          }).queryKey,
        },
        { alreadySent: true },
        (item) => data.sent.includes(item.id),
      );
    },
    [queryClient],
  );

  return { markSent };
};

export const useRecoCacheUpdate = ({
  userId,
}: {
  userId?: string;
} = {}) => {
  const queryClient = useQueryClient();

  // `RecoWithMedia` (the grouped-by-media DTO) has no `userId` field — it's always scoped to
  // "the current user's received recos" implicitly. Realtime RECEIVED events are only ever
  // delivered to the receiver's own room, so `userId` must come from the caller (the logged-in
  // user), not from the payload.
  const upsertReceived = useCallback(
    (data: RecoWithMedia) => {
      if (!userId) return;

      // The unfiltered "all" cache can be upserted directly since the payload already carries
      // the complete, correct senders array for this media (recomputed server-side) — no need to
      // wait on a refetch for it.
      queryClient.setQueryData(userRecosAllOptions({ userId }).queryKey, (old) => {
        if (!old) return old;
        const index = old.findIndex(
          (item) => item.mediaId === data.mediaId && item.type === data.type,
        );
        if (index === -1) return [data, ...old];
        const next = [...old];
        next[index] = data;
        return next;
      });

      // Paginated/infinite ordering depends on the server — invalidate rather than guess the
      // insertion/reorder position. The unfiltered "all" cache was already patched above, so
      // it's deliberately excluded here to avoid an immediate redundant refetch of it.
      queryClient.invalidateQueries({
        queryKey: userKeys.recos({ userId, mode: 'paginated' }),
      });
      queryClient.invalidateQueries({
        queryKey: userKeys.recos({ userId, mode: 'infinite' }),
      });
    },
    [queryClient, userId],
  );

  // `Reco` (bare, ungrouped) always carries `userId` — the receiver whose grouped list is
  // affected — regardless of whether the sender or the receiver triggered the deletion.
  const removeDeleted = useCallback(
    (recos: Reco[]) => {
      const firstReco = recos[0];
      if (!firstReco) return;

      const removedSenderIds = new Set(recos.map((r) => r.id));

      updateOrRemoveListItemInAllCaches<RecoWithMedia, ListPaginatedRecos, ListInfiniteRecos>(
        queryClient,
        {
          all: userKeys.recos({ userId: firstReco.userId, mode: 'all' }),
          paginated: userKeys.recos({ userId: firstReco.userId, mode: 'paginated' }),
          infinite: userKeys.recos({ userId: firstReco.userId, mode: 'infinite' }),
        },
        (item) => item.mediaId === firstReco.mediaId && item.type === firstReco.type,
        (item) => {
          const remainingSenders = item.senders.filter((s) => !removedSenderIds.has(s.id));

          if (remainingSenders.length === 0) {
            return null;
          }

          const newLatestCreatedAt = remainingSenders.reduce((latest, current) =>
            current.createdAt > latest.createdAt ? current : latest,
          ).createdAt;

          return {
            senders: remainingSenders,
            latestCreatedAt: newLatestCreatedAt,
          };
        },
      );
    },
    [queryClient],
  );

  return { upsertReceived, removeDeleted };
};

export const useUserFollowCacheUpdate = () => {
  const queryClient = useQueryClient();

  const setFollow = useCallback(
    (data: Follow) => {
      queryClient.setQueryData(
        userFollowOptions({ userId: data.followerId, profileId: data.followingId }).queryKey,
        data,
      );

      queryClient.invalidateQueries({
        queryKey: userKeys.followers({ userId: data.followingId }),
      });
      queryClient.invalidateQueries({
        queryKey: userKeys.following({ userId: data.followerId }),
      });

      if (data.status === 'pending') {
        queryClient.invalidateQueries({
          queryKey: userKeys.followRequests({ userId: data.followingId }),
        });
      }
    },
    [queryClient],
  );

  const deleteFollow = useCallback(
    (data: Follow) => {
      queryClient.setQueryData(
        userFollowOptions({ userId: data.followerId, profileId: data.followingId }).queryKey,
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

      if (data.status === 'pending') {
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
      }
    },
    [queryClient],
  );

  const acceptFollow = useCallback(
    (data: Follow) => {
      queryClient.setQueryData(
        userFollowOptions({ userId: data.followerId, profileId: data.followingId }).queryKey,
        data,
      );

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
        queryKey: userKeys.followers({ userId: data.followingId }),
      });
      queryClient.invalidateQueries({
        queryKey: userKeys.following({ userId: data.followerId }),
      });
    },
    [queryClient],
  );

  const declineFollow = useCallback(
    (data: Follow) => {
      queryClient.setQueryData(
        userFollowOptions({ userId: data.followerId, profileId: data.followingId }).queryKey,
        null,
      );

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
    [queryClient],
  );

  return { setFollow, deleteFollow, acceptFollow, declineFollow };
};

export const usePersonFollowCacheUpdate = () => {
  const queryClient = useQueryClient();

  const setPersonFollow = useCallback(
    (data: PersonFollow) => {
      queryClient.setQueryData(
        userPersonFollowOptions({ userId: data.userId, personId: data.personId }).queryKey,
        true,
      );

      queryClient.invalidateQueries({ queryKey: userKeys.feedPersons({ userId: data.userId }) });
    },
    [queryClient],
  );

  const deletePersonFollow = useCallback(
    (data: PersonFollow) => {
      queryClient.setQueryData(
        userPersonFollowOptions({ userId: data.userId, personId: data.personId }).queryKey,
        false,
      );

      removeListItemFromAllCaches<
        | ({ type: 'movie' } & PersonFeedWithMovie)
        | ({ type: 'tv_series' } & PersonFeedWithTvSeries),
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
    [queryClient],
  );

  return { setPersonFollow, deletePersonFollow };
};

export const usePlaylistLikeCacheUpdate = () => {
  const queryClient = useQueryClient();

  const setPlaylistLike = useCallback(
    (data: PlaylistLike) => {
      queryClient.setQueryData(
        userPlaylistLikeOptions({ userId: data.userId, playlistId: data.playlistId }).queryKey,
        true,
      );

      queryClient.invalidateQueries({ queryKey: userKeys.feed({ userId: data.userId }) });
    },
    [queryClient],
  );

  const deletePlaylistLike = useCallback(
    (data: PlaylistLike) => {
      queryClient.setQueryData(
        userPlaylistLikeOptions({ userId: data.userId, playlistId: data.playlistId }).queryKey,
        false,
      );

      const isPlaylistLikeActivity = (item: FeedItem) =>
        item.activityType === 'playlist_like' &&
        item.content.id === data.playlistId &&
        item.author.id === data.userId;

      removeListItemFromAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: meFeedPaginatedOptions({ userId: data.userId }).queryKey,
          infinite: meFeedInfiniteOptions({ userId: data.userId }).queryKey,
        },
        isPlaylistLikeActivity,
      );
      removeListItemFromAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: userFeedPaginatedOptions({ userId: data.userId }).queryKey,
          infinite: userFeedInfiniteOptions({ userId: data.userId }).queryKey,
        },
        isPlaylistLikeActivity,
      );
    },
    [queryClient],
  );

  return { setPlaylistLike, deletePlaylistLike };
};

export const usePlaylistSaveCacheUpdate = () => {
  const queryClient = useQueryClient();

  const setPlaylistSave = useCallback(
    (data: PlaylistSaved) => {
      queryClient.setQueryData(
        userPlaylistSavedOptions({ userId: data.userId, playlistId: data.playlistId }).queryKey,
        true,
      );

      queryClient.invalidateQueries({
        queryKey: userKeys.playlistsSaved({ userId: data.userId }),
      });
    },
    [queryClient],
  );

  const deletePlaylistSave = useCallback(
    (data: PlaylistSaved) => {
      queryClient.setQueryData(
        userPlaylistSavedOptions({ userId: data.userId, playlistId: data.playlistId }).queryKey,
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
    [queryClient],
  );

  return { setPlaylistSave, deletePlaylistSave };
};
