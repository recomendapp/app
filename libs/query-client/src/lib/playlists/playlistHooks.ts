import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  Playlist,
  ListPaginatedPlaylists,
  ListInfinitePlaylists,
  ListPaginatedPlaylistsWithOwner,
  ListInfinitePlaylistsWithOwner,
  PlaylistsAddTarget,
  ListPaginatedPlaylistsAddTargets,
  ListInfinitePlaylistsAddTargets,
  FeedItem,
  ListPaginatedFeed,
  ListInfiniteFeed,
  SearchResponse,
  PinnedItemWithData,
} from '@libs/api-js';
import {
  playlistFeaturedInfiniteOptions,
  playlistFeaturedPaginatedOptions,
  playlistOptions,
} from './playlistOptions';
import {
  userPlaylistsPaginatedOptions,
  userPlaylistsInfiniteOptions,
  userPlaylistsFollowingPaginatedOptions,
  userPlaylistsFollowingInfiniteOptions,
  userFeedPaginatedOptions,
  userFeedInfiniteOptions,
} from '../users';
import { moviePlaylistsPaginatedOptions, moviePlaylistsInfiniteOptions } from '../movies';
import { tvSeriesPlaylistsPaginatedOptions, tvSeriesPlaylistsInfiniteOptions } from '../tv-series';
import {
  updateListItemInAllCaches,
  ItemUpdater,
  resolveUpdater,
  removeListItemFromAllCaches,
  removeFromPaginatedCache,
  removeFromInfiniteCache,
} from '../utils';
import {
  searchGlobalOptions,
  searchPlaylistsInfiniteOptions,
  searchPlaylistsPaginatedOptions,
} from '../search';
import { meFeedInfiniteOptions, meFeedPaginatedOptions } from '../me';
import { useCallback } from 'react';

const isPinnedQueryKey = (queryKey: readonly unknown[]) =>
  queryKey[0] === 'user' && queryKey.length === 3 && queryKey[2] === 'pinned';

export const usePlaylistCacheUpdate = ({
  userId,
}: {
  userId?: string;
} = {}) => {
  const queryClient = useQueryClient();

  return useCallback(
    (playlistId: number, updater: ItemUpdater<Playlist>, playlistOwnerId?: string) => {
      const targetUserId = playlistOwnerId || userId;

      queryClient.setQueryData(playlistOptions({ playlistId }).queryKey, (old) => {
        if (!old) return undefined;
        return {
          ...old,
          ...resolveUpdater(old, updater),
        };
      });

      // 1. User Playlists
      if (targetUserId) {
        updateListItemInAllCaches<Playlist, ListPaginatedPlaylists, ListInfinitePlaylists>(
          queryClient,
          {
            paginated: userPlaylistsPaginatedOptions({ userId: targetUserId }).queryKey,
            infinite: userPlaylistsInfiniteOptions({ userId: targetUserId }).queryKey,
          },
          updater,
          playlistId,
        );
      }

      // 3. Following Playlists
      if (userId && targetUserId && userId !== targetUserId) {
        updateListItemInAllCaches<
          Playlist,
          ListPaginatedPlaylistsWithOwner,
          ListInfinitePlaylistsWithOwner
        >(
          queryClient,
          {
            paginated: userPlaylistsFollowingPaginatedOptions({ userId: userId }).queryKey,
            infinite: userPlaylistsFollowingInfiniteOptions({ userId: userId }).queryKey,
          },
          updater,
          playlistId,
        );
      }

      // 4. Playlists Add Targets
      updateListItemInAllCaches<
        PlaylistsAddTarget,
        ListPaginatedPlaylistsAddTargets,
        ListInfinitePlaylistsAddTargets
      >(
        queryClient,
        {
          all: {
            predicate: ({ queryKey }) =>
              queryKey.includes('playlists_add_targets') && queryKey.includes('all'),
          },
          paginated: {
            predicate: ({ queryKey }) =>
              queryKey.includes('playlists_add_targets') && queryKey.includes('paginated'),
          },
          infinite: {
            predicate: ({ queryKey }) =>
              queryKey.includes('playlists_add_targets') && queryKey.includes('infinite'),
          },
        },
        updater,
        playlistId,
      );

      // 5. Movies
      updateListItemInAllCaches<
        Playlist,
        ListPaginatedPlaylistsWithOwner,
        ListInfinitePlaylistsWithOwner
      >(
        queryClient,
        {
          paginated: {
            predicate: ({ queryKey }) => {
              const refKey = moviePlaylistsPaginatedOptions({ movieId: -1 }).queryKey;
              return (
                queryKey[0] === refKey[0] &&
                typeof queryKey[1] === typeof refKey[1] &&
                queryKey[2] === refKey[2] &&
                queryKey[3] === refKey[3]
              );
            },
          },
          infinite: {
            predicate: ({ queryKey }) => {
              const refKey = moviePlaylistsInfiniteOptions({ movieId: -1 }).queryKey;
              return (
                queryKey[0] === refKey[0] &&
                typeof queryKey[1] === typeof refKey[1] &&
                queryKey[2] === refKey[2] &&
                queryKey[3] === refKey[3]
              );
            },
          },
        },
        updater,
        playlistId,
      );

      // 6. TV Series
      updateListItemInAllCaches<
        Playlist,
        ListPaginatedPlaylistsWithOwner,
        ListInfinitePlaylistsWithOwner
      >(
        queryClient,
        {
          paginated: {
            predicate: ({ queryKey }) => {
              const refKey = tvSeriesPlaylistsPaginatedOptions({ tvSeriesId: -1 }).queryKey;
              return (
                queryKey[0] === refKey[0] &&
                typeof queryKey[1] === typeof refKey[1] &&
                queryKey[2] === refKey[2] &&
                queryKey[3] === refKey[3]
              );
            },
          },
          infinite: {
            predicate: ({ queryKey }) => {
              const refKey = tvSeriesPlaylistsInfiniteOptions({ tvSeriesId: -1 }).queryKey;
              return (
                queryKey[0] === refKey[0] &&
                typeof queryKey[1] === typeof refKey[1] &&
                queryKey[2] === refKey[2] &&
                queryKey[3] === refKey[3]
              );
            },
          },
        },
        updater,
        playlistId,
      );

      // Feed
      updateListItemInAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: meFeedPaginatedOptions({ userId: targetUserId }).queryKey,
          infinite: meFeedInfiniteOptions({ userId: targetUserId }).queryKey,
        },
        (old) => {
          if (old.activityType !== 'playlist_like') return old;
          return {
            ...old,
            content: {
              ...old.content,
              ...resolveUpdater(old.content as Playlist, updater),
            },
          };
        },
        (item) => item.activityType === 'playlist_like' && item.content.id === playlistId,
      );
      updateListItemInAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: userFeedPaginatedOptions({ userId: targetUserId }).queryKey,
          infinite: userFeedInfiniteOptions({ userId: targetUserId }).queryKey,
        },
        (old) => {
          if (old.activityType !== 'playlist_like') return old;
          // how use updater here
          return {
            ...old,
            content: {
              ...old.content,
              ...resolveUpdater(old.content as Playlist, updater),
            },
          };
        },
        (item) => item.activityType === 'playlist_like' && item.content.id === playlistId,
      );

      // Featured
      updateListItemInAllCaches<Playlist, ListPaginatedPlaylists, ListInfinitePlaylists>(
        queryClient,
        {
          paginated: playlistFeaturedPaginatedOptions().queryKey,
          infinite: playlistFeaturedInfiniteOptions().queryKey,
        },
        updater,
        playlistId,
      );

      // Search
      updateListItemInAllCaches<Playlist, ListPaginatedPlaylists, ListInfinitePlaylists>(
        queryClient,
        {
          paginated: searchPlaylistsPaginatedOptions().queryKey,
          infinite: searchPlaylistsInfiniteOptions().queryKey,
        },
        updater,
        playlistId,
      );
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const refKey = searchGlobalOptions().queryKey;
            return query.queryKey[0] === refKey[0] && query.queryKey[1] === refKey[1];
          },
        },
        (old: SearchResponse) => {
          if (!old) return old;
          const updatedPlaylists = old.playlists?.map((item) => {
            if (item.id !== playlistId) return item;
            return {
              ...item,
              ...resolveUpdater(item, updater),
            };
          });
          if (!updatedPlaylists) return old;
          return {
            ...old,
            playlists: updatedPlaylists,
          };
        },
      );

      // Pinned
      queryClient.setQueriesData<PinnedItemWithData[]>(
        { predicate: ({ queryKey }) => isPinnedQueryKey(queryKey) },
        (old) => {
          if (!old) return old;
          return old.map((item) =>
            item.type === 'playlist' && item.data && item.data.id === playlistId
              ? { ...item, data: { ...item.data, ...resolveUpdater(item.data, updater) } }
              : item,
          );
        },
      );
    },
    [queryClient, userId],
  );
};

export const usePlaylistCacheDelete = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (playlistId: number, ownerId: string) => {
      queryClient.setQueryData(playlistOptions({ playlistId }).queryKey, undefined);

      removeListItemFromAllCaches(
        queryClient,
        {
          paginated: userPlaylistsPaginatedOptions({ userId: ownerId }).queryKey,
          infinite: userPlaylistsInfiniteOptions({ userId: ownerId }).queryKey,
        },
        playlistId,
      );

      // Movies
      removeFromPaginatedCache(
        queryClient,
        {
          predicate: ({ queryKey }) => {
            const refKey = moviePlaylistsPaginatedOptions({ movieId: -1 }).queryKey;
            return (
              queryKey[0] === refKey[0] &&
              typeof queryKey[1] === typeof refKey[1] &&
              queryKey[2] === refKey[2] &&
              queryKey[3] === refKey[3]
            );
          },
        },
        playlistId,
      );
      queryClient.setQueriesData(
        {
          predicate: ({ queryKey }) => {
            const refKey = moviePlaylistsInfiniteOptions({ movieId: -1 }).queryKey;
            return (
              queryKey[0] === refKey[0] &&
              typeof queryKey[1] === typeof refKey[1] &&
              queryKey[2] === refKey[2] &&
              queryKey[3] === refKey[3]
            );
          },
        },
        (old: InfiniteData<ListInfinitePlaylistsWithOwner> | undefined) => {
          return removeFromInfiniteCache(old, playlistId);
        },
      );

      // Tv Series
      removeFromPaginatedCache(
        queryClient,
        {
          predicate: ({ queryKey }) => {
            const refKey = tvSeriesPlaylistsPaginatedOptions({ tvSeriesId: -1 }).queryKey;
            return (
              queryKey[0] === refKey[0] &&
              typeof queryKey[1] === typeof refKey[1] &&
              queryKey[2] === refKey[2] &&
              queryKey[3] === refKey[3]
            );
          },
        },
        playlistId,
      );
      queryClient.setQueriesData(
        {
          predicate: ({ queryKey }) => {
            const refKey = tvSeriesPlaylistsInfiniteOptions({ tvSeriesId: -1 }).queryKey;
            return (
              queryKey[0] === refKey[0] &&
              typeof queryKey[1] === typeof refKey[1] &&
              queryKey[2] === refKey[2] &&
              queryKey[3] === refKey[3]
            );
          },
        },
        (old: InfiniteData<ListInfinitePlaylistsWithOwner> | undefined) => {
          return removeFromInfiniteCache(old, playlistId);
        },
      );

      // Playlists Add Targets
      removeListItemFromAllCaches<
        PlaylistsAddTarget,
        ListPaginatedPlaylistsAddTargets,
        ListInfinitePlaylistsAddTargets
      >(
        queryClient,
        {
          all: {
            predicate: ({ queryKey }) =>
              queryKey.includes('playlists_add_targets') && queryKey.includes('all'),
          },
          paginated: {
            predicate: ({ queryKey }) =>
              queryKey.includes('playlists_add_targets') && queryKey.includes('paginated'),
          },
          infinite: {
            predicate: ({ queryKey }) =>
              queryKey.includes('playlists_add_targets') && queryKey.includes('infinite'),
          },
        },
        playlistId,
      );

      // Feed
      removeListItemFromAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: meFeedPaginatedOptions({ userId: ownerId }).queryKey,
          infinite: meFeedInfiniteOptions({ userId: ownerId }).queryKey,
        },
        (item) => item.activityType === 'playlist_like' && item.content.id === playlistId,
      );
      removeListItemFromAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: userFeedPaginatedOptions({ userId: ownerId }).queryKey,
          infinite: userFeedInfiniteOptions({ userId: ownerId }).queryKey,
        },
        (item) => item.activityType === 'playlist_like' && item.content.id === playlistId,
      );

      // Featured
      removeListItemFromAllCaches(
        queryClient,
        {
          paginated: playlistFeaturedPaginatedOptions().queryKey,
          infinite: playlistFeaturedInfiniteOptions().queryKey,
        },
        playlistId,
      );

      // Search
      removeListItemFromAllCaches<Playlist, ListPaginatedPlaylists, ListInfinitePlaylists>(
        queryClient,
        {
          paginated: searchPlaylistsPaginatedOptions().queryKey,
          infinite: searchPlaylistsInfiniteOptions().queryKey,
        },
        playlistId,
      );
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const refKey = searchGlobalOptions().queryKey;
            return query.queryKey[0] === refKey[0] && query.queryKey[1] === refKey[1];
          },
        },
        (old: SearchResponse) => {
          if (!old) return old;
          return {
            ...old,
            playlists: old.playlists.filter((playlist) => playlist.id !== playlistId),
          };
        },
      );

      queryClient.setQueriesData<PinnedItemWithData[]>(
        { predicate: ({ queryKey }) => isPinnedQueryKey(queryKey) },
        (old) => {
          if (!old) return old;
          return old.filter((item) => !(item.type === 'playlist' && item.data?.id === playlistId));
        },
      );
    },
    [queryClient],
  );
};
