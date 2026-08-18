import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ListInfinitePlaylistItems,
  ListInfinitePlaylistsAddTargets,
  ListPaginatedPlaylistItems,
  ListPaginatedPlaylistsAddTargets,
  PlaylistItemWithMedia,
  PlaylistsAddTarget,
  realtime,
} from '@libs/api-js';
import {
  playlistItemsAllOptions,
  playlistItemsInfiniteOptions,
  playlistItemsPaginatedOptions,
} from '../playlists/playlistOptions';
import {
  userPlaylistsAddTargetsAllOptions,
  userPlaylistsAddTargetsInfiniteOptions,
  userPlaylistsAddTargetsPaginatedOptions,
} from '../users';
import { usePlaylistCacheUpdate } from '../playlists/playlistHooks';
import { removeListItemFromAllCaches, updateListItemInAllCaches } from '../utils';
import { meOptions } from '../me';

export function useRealtimeSyncPlaylists(enabled: boolean) {
  const queryClient = useQueryClient();
  const { data: user } = useQuery(meOptions());
  const updatePlaylistCache = usePlaylistCacheUpdate({ userId: user?.id });

  useEffect(() => {
    if (!enabled) return;

    return realtime.onPlaylistEvents({
      onItemAdded: (items) => {
        const byPlaylistId = new Map<number, PlaylistItemWithMedia[]>();
        for (const item of items) {
          const group = byPlaylistId.get(item.playlistId) ?? [];
          group.push(item);
          byPlaylistId.set(item.playlistId, group);
        }

        for (const [playlistId, playlistItems] of byPlaylistId) {
          queryClient.setQueryData(playlistItemsAllOptions({ playlistId }).queryKey, (oldData) => {
            if (!oldData) return oldData;

            const newData = [...oldData];
            for (const newItem of playlistItems) {
              if (!newData.some((item) => item.id === newItem.id)) {
                newData.push(newItem);
              }
            }

            newData.sort((a, b) => a.rank.localeCompare(b.rank));
            return newData;
          });

          queryClient.invalidateQueries({
            queryKey: playlistItemsPaginatedOptions({ playlistId }).queryKey,
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: playlistItemsInfiniteOptions({ playlistId }).queryKey,
            exact: false,
          });

          updatePlaylistCache(
            playlistId,
            (prev) => ({ itemsCount: (prev?.itemsCount || 0) + playlistItems.length }),
            playlistItems[0].userId,
          );
        }

        if (user?.id) {
          for (const item of items) {
            updateListItemInAllCaches<
              PlaylistsAddTarget,
              ListPaginatedPlaylistsAddTargets,
              ListInfinitePlaylistsAddTargets
            >(
              queryClient,
              {
                all: userPlaylistsAddTargetsAllOptions({
                  userId: user.id,
                  mediaId: item.mediaId,
                  type: item.type,
                }).queryKey,
                paginated: userPlaylistsAddTargetsPaginatedOptions({
                  userId: user.id,
                  mediaId: item.mediaId,
                  type: item.type,
                }).queryKey,
                infinite: userPlaylistsAddTargetsInfiniteOptions({
                  userId: user.id,
                  mediaId: item.mediaId,
                  type: item.type,
                }).queryKey,
              },
              { alreadyAdded: true },
              (target) => target.id === item.playlistId,
            );
          }
        }
      },

      onItemUpdated: (updatedSignal) => {
        const { playlistId, ...updatedItem } = updatedSignal;

        queryClient.setQueryData(playlistItemsAllOptions({ playlistId }).queryKey, (oldData) => {
          if (!oldData) return oldData;
          const newData = oldData.map((item) =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item,
          );
          newData.sort((a, b) => a.rank.localeCompare(b.rank));
          return newData;
        });

        updateListItemInAllCaches<
          PlaylistItemWithMedia,
          ListPaginatedPlaylistItems,
          ListInfinitePlaylistItems
        >(
          queryClient,
          {
            paginated: playlistItemsPaginatedOptions({ playlistId }).queryKey,
            infinite: playlistItemsInfiniteOptions({ playlistId }).queryKey,
          },
          updatedItem,
        );
      },

      onItemDeleted: ({ playlistId, itemIds }) => {
        removeListItemFromAllCaches<
          PlaylistItemWithMedia,
          ListPaginatedPlaylistItems,
          ListInfinitePlaylistItems
        >(
          queryClient,
          {
            all: playlistItemsAllOptions({ playlistId }).queryKey,
            paginated: playlistItemsPaginatedOptions({ playlistId }).queryKey,
            infinite: playlistItemsInfiniteOptions({ playlistId }).queryKey,
          },
          (item) => itemIds.includes(item.id),
        );

        updatePlaylistCache(playlistId, (prev) => ({
          itemsCount: Math.max((prev?.itemsCount || itemIds.length) - itemIds.length, 0),
        }));
      },
    });
  }, [enabled, queryClient, updatePlaylistCache, user?.id]);
}
