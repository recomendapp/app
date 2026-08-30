import {
  ListInfinitePlaylistMembers,
  ListPaginatedPlaylistMembers,
  Options,
  Playlist,
  playlistItemsControllerDeleteMutation,
  playlistItemsControllerUpdateMutation,
  playlistMembersControllerAddMutation,
  playlistMembersControllerDeleteMutation,
  playlistMembersControllerUpdateMutation,
  PlaylistMemberWithUser,
  playlistPosterControllerDelete,
  playlistPosterControllerSet,
  playlistsAddControllerAddMutation,
  playlistsControllerCreate,
  PlaylistsControllerCreateData,
  playlistsControllerDeleteMutation,
  playlistsControllerDuplicateMutation,
  playlistsControllerUpdate,
  PlaylistsControllerUpdateData,
} from '@libs/api-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  playlistItemsAllOptions,
  playlistMembersAllOptions,
  playlistMembersInfiniteOptions,
  playlistMembersPaginatedOptions,
} from './playlistOptions';
import { removeListItemFromAllCaches, updateListItemInAllCaches } from '../utils';
import { usePlaylistCacheUpdate } from './playlistHooks';
import { playlistKeys } from './playlistKeys';

export const usePlaylistInsertMutation = () => {
  return useMutation({
    mutationFn: async ({
      body: { poster, ...body },
      ...variables
    }: Options<PlaylistsControllerCreateData, false> & { body: { poster?: File } }) => {
      let returnData: Playlist | undefined;
      const { data, error } = await playlistsControllerCreate({
        ...variables,
        body,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      returnData = data;
      if (poster) {
        const formData = new FormData();
        formData.append('file', poster);
        const { data: posterData, error } = await playlistPosterControllerSet({
          path: {
            playlist_id: returnData.id,
          },
          body: formData as unknown as { file: File },
          bodySerializer: (formData) => formData,
        });
        if (error) throw error;
        if (posterData === undefined) throw new Error('No data');
        returnData = posterData;
      }
      return returnData;
    },
  });
};

export const usePlaylistUpdateMutation = () => {
  return useMutation({
    mutationFn: async ({
      body: { poster, ...body },
      ...variables
    }: Options<PlaylistsControllerUpdateData, false> & { body: { poster?: File | null } }) => {
      if (poster === null) {
        const { data, error } = await playlistPosterControllerDelete({
          path: variables.path,
        });
        if (error) throw error;
        if (data === undefined) throw new Error('No data');
      } else if (poster) {
        const formData = new FormData();
        formData.append('file', poster);
        const { data, error } = await playlistPosterControllerSet({
          path: variables.path,
          body: formData as unknown as { file: File },
          bodySerializer: (formData) => formData,
        });
        if (error) throw error;
        if (data === undefined) throw new Error('No data');
      }
      const { data, error } = await playlistsControllerUpdate({
        ...variables,
        body,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const usePlaylistDeleteMutation = () => {
  return useMutation({
    ...playlistsControllerDeleteMutation(),
  });
};

export const usePlaylistDuplicateMutation = () => {
  return useMutation({
    ...playlistsControllerDuplicateMutation(),
  });
};

/* ---------------------------------- Items --------------------------------- */
export const usePlaylistItemsAddMutation = () => {
  return useMutation({
    ...playlistsAddControllerAddMutation(),
  });
};
export const usePlaylistItemUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...playlistItemsControllerUpdateMutation(),
    onMutate: async (variables) => {
      const playlistId = variables.path.playlist_id;
      const itemId = variables.path.item_id;
      const newValues = variables.body;

      const allKey = playlistItemsAllOptions({ playlistId }).queryKey;

      await queryClient.cancelQueries({ queryKey: allKey });

      const previousAll = queryClient.getQueryData(allKey);

      queryClient.setQueryData(allKey, (old) => {
        if (!old) return old;
        const updatedList = [...old];
        const currentIndex = updatedList.findIndex((item) => item.id === itemId);
        if (currentIndex === -1) return old;
        const [itemToMove] = updatedList.splice(currentIndex, 1);
        const updatedItem = { ...itemToMove, ...newValues };
        if (newValues.position !== undefined && newValues.position !== null) {
          updatedList.splice(newValues.position - 1, 0, updatedItem);
        } else {
          updatedList.splice(currentIndex, 0, updatedItem);
        }
        return updatedList;
      });

      return { previousAll, allKey };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        if (context.previousAll) {
          queryClient.setQueryData(context.allKey, context.previousAll);
        }
      }
    },
  });
};
export const usePlaylistItemsDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...playlistItemsControllerDeleteMutation(),
    onMutate: async (variables) => {
      const playlistId = variables.path.playlist_id;
      const itemIds = variables.body.itemIds;

      const allKey = playlistItemsAllOptions({ playlistId }).queryKey;

      await queryClient.cancelQueries({ queryKey: allKey });

      const previousAll = queryClient.getQueryData(allKey);

      queryClient.setQueryData(allKey, (old) => {
        if (!old) return old;
        return old.filter((item) => !itemIds.includes(item.id));
      });

      return { previousAll, allKey };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        if (context.previousAll) {
          queryClient.setQueryData(context.allKey, context.previousAll);
        }
      }
    },
  });
};

/* --------------------------------- Members -------------------------------- */
export const usePlaylistMembersAddMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...playlistMembersControllerAddMutation(),
    onSuccess: (data) => {
      if (data.length === 0) return;
      const playlistId = data[0]?.playlistId;
      queryClient.invalidateQueries({
        queryKey: playlistKeys.members({ playlistId: playlistId }),
      });
    },
  });
};
export const usePlaylistMembersDeleteMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  const updatePlaylistCache = usePlaylistCacheUpdate({
    userId,
  });
  return useMutation({
    ...playlistMembersControllerDeleteMutation(),
    onSuccess: (data) => {
      if (data.length === 0) return;
      const playlistId = data[0]?.playlistId;
      const ownerId = data[0]?.userId;
      removeListItemFromAllCaches<
        PlaylistMemberWithUser,
        ListPaginatedPlaylistMembers,
        ListInfinitePlaylistMembers
      >(
        queryClient,
        {
          all: playlistMembersAllOptions({ playlistId: playlistId }).queryKey,
          paginated: playlistMembersPaginatedOptions({ playlistId: playlistId }).queryKey,
          infinite: playlistMembersInfiniteOptions({ playlistId: playlistId }).queryKey,
        },
        (item) => data.some((deleted) => deleted.userId === item.userId),
      );

      if (userId && data.some((deleted) => deleted.userId === userId)) {
        updatePlaylistCache(playlistId, { role: null }, ownerId);
      }
    },
  });
};
export const usePlaylistMemberUpdateMutation = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();
  const updatePlaylistCache = usePlaylistCacheUpdate({
    userId,
  });
  return useMutation({
    ...playlistMembersControllerUpdateMutation(),
    onSuccess: (data) => {
      const playlistId = data.playlistId;

      updateListItemInAllCaches<
        PlaylistMemberWithUser,
        ListPaginatedPlaylistMembers,
        ListInfinitePlaylistMembers
      >(
        queryClient,
        {
          all: playlistMembersAllOptions({ playlistId: playlistId }).queryKey,
          paginated: playlistMembersPaginatedOptions({ playlistId: playlistId }).queryKey,
          infinite: playlistMembersInfiniteOptions({ playlistId: playlistId }).queryKey,
        },
        data,
      );

      if (userId && data.userId === userId) {
        updatePlaylistCache(playlistId, { role: data.role }, data.userId);
      }
    },
  });
};
