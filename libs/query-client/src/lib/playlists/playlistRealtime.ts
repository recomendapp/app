import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ListInfinitePlaylistItems, ListPaginatedPlaylistItems, Playlist, playlistItemsControllerGet, PlaylistItemWithMedia, realtime, ROLES_CAN_EDIT } from '@packages/api-js';
import { playlistItemsAllOptions, playlistItemsInfiniteOptions, playlistItemsPaginatedOptions } from './playlistOptions';
import { removeListItemFromAllCaches, updateListItemInAllCaches } from '../utils';

export function usePlaylistRealtime({
    playlistId,
    role,
}: {
    playlistId?: number;
    role?: Playlist['role'];
}) {
  const queryClient = useQueryClient();
  const canEdit = useMemo(() => {
    if (!role) return false;
    return ROLES_CAN_EDIT.includes(role);
  }, [role]);

  useEffect(() => {
    if (!playlistId || !canEdit) return;
    const unsubscribe = realtime.subscribe(
      { playlist: playlistId },
      {
        onItemAdded: async (signals) => {
          const fetchPromises = signals.map(signal => 
            queryClient.fetchQuery({
              queryKey: ['playlistItem_realtime_fetch', playlistId, signal.id],
              queryFn: () => playlistItemsControllerGet({ path: { playlist_id: playlistId, item_id: signal.id } }),
              staleTime: 5000,
            })
          );
          
          try {
            const responses = await Promise.all(fetchPromises);
            const fullyPopulatedItems = responses
                .map(r => r.data)
                .filter((item) => item !== undefined);
            
            if (fullyPopulatedItems.length === 0) return;

            queryClient.setQueryData(playlistItemsAllOptions({ playlistId }).queryKey, (oldData) => {
                if (!oldData) return oldData;
                
                const newData = [...oldData];
                for (const newItem of fullyPopulatedItems) {
                    if (!newData.some(item => item.id === newItem.id)) {
                        newData.push(newItem);
                    }
                }
                
                newData.sort((a, b) => a.rank.localeCompare(b.rank));
                return newData;
            });
            
            queryClient.invalidateQueries({ queryKey: playlistItemsPaginatedOptions({ playlistId }).queryKey, exact: false });
            queryClient.invalidateQueries({ queryKey: playlistItemsInfiniteOptions({ playlistId }).queryKey, exact: false });
          } catch (e) {
            console.error("Failed to fetch populated items", e);
          }
        },

        onItemUpdated: (updatedSignal) => {
            queryClient.setQueryData(playlistItemsAllOptions({ playlistId }).queryKey, (oldData) => {
                if (!oldData) return oldData;
                const newData = oldData.map((item) => 
                    item.id === updatedSignal.id ? { ...item, ...updatedSignal } : item
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
                updatedSignal,
            );
        },

        onItemDeleted: (itemIds) => {
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
        }
      }
    );

    return () => unsubscribe();
  }, [playlistId, queryClient, canEdit]);
}