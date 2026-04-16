import { FeedItem, ListInfiniteFeed, ListInfinitePlaylistItems, ListInfinitePlaylistMembers, ListInfinitePlaylists, ListInfinitePlaylistsAddTargets, ListInfinitePlaylistsWithOwner, ListPaginatedFeed, ListPaginatedPlaylistItems, ListPaginatedPlaylistMembers, ListPaginatedPlaylists, ListPaginatedPlaylistsAddTargets, Options, Playlist, playlistItemsControllerDeleteMutation, playlistItemsControllerUpdateMutation, PlaylistItemWithMedia, playlistMembersControllerAddMutation, playlistMembersControllerDeleteMutation, playlistMembersControllerUpdateMutation, PlaylistMemberWithUser, playlistPosterControllerDelete, playlistPosterControllerDeleteMutation, playlistPosterControllerSet, playlistPosterControllerSetMutation, playlistsAddControllerAddMutation, PlaylistsAddTarget, playlistsControllerCreate, PlaylistsControllerCreateData, playlistsControllerDeleteMutation, playlistsControllerUpdate, PlaylistsControllerUpdateData, SearchResponse } from "@libs/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { userFeedInfiniteOptions, userFeedPaginatedOptions, userKeys, userPlaylistsAddTargetsAllOptions, userPlaylistsAddTargetsInfiniteOptions, userPlaylistsAddTargetsPaginatedOptions, userPlaylistsInfiniteOptions, userPlaylistsPaginatedOptions } from "../users";
import { playlistFeaturedInfiniteOptions, playlistFeaturedPaginatedOptions, playlistItemsAllOptions, playlistItemsInfiniteOptions, playlistItemsPaginatedOptions, playlistMembersAllOptions, playlistMembersInfiniteOptions, playlistMembersPaginatedOptions, playlistOptions } from "./playlistOptions";
import { removeFromInfiniteCache, removeFromPaginatedCache, removeListItemFromAllCaches, updateListItemInAllCaches } from "../utils";
import { moviePlaylistsInfiniteOptions, moviePlaylistsPaginatedOptions } from "../movies";
import { tvSeriesPlaylistsInfiniteOptions, tvSeriesPlaylistsPaginatedOptions } from "../tv-series";
import { usePlaylistCacheUpdate } from "./playlistHooks";
import { playlistKeys } from "./playlistKeys";
import { searchGlobalOptions, searchPlaylistsInfiniteOptions, searchPlaylistsPaginatedOptions } from "../search";

export const usePlaylistInsertMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ body: { poster, ...body }, ...variables }: Options<PlaylistsControllerCreateData> & { body: { poster?: File }}) => {
			let returnData: Playlist | undefined;
			const { data } = await playlistsControllerCreate({
				...variables,
				body,
			});
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
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: userKeys.playlists({ userId: data.userId }),
			})

			const userPlaylistTargetKey = userPlaylistsAddTargetsAllOptions({ userId: data.userId, mediaId: -1, type: 'movie' }).queryKey;
			queryClient.invalidateQueries({
				predicate: ({ queryKey }) => (
					queryKey[0] === userPlaylistTargetKey[0] &&
					queryKey[1] === userPlaylistTargetKey[1] &&
					queryKey[2] === userPlaylistTargetKey[2]
				)
			});
		}
	});
};

export const usePlaylistUpdateMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const updatePlaylistCache = usePlaylistCacheUpdate({
		userId,
	});
	return useMutation({
		mutationFn: async ({ body: { poster, ...body }, ...variables }: Options<PlaylistsControllerUpdateData> & { body: { poster?: File | null }}) => {
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
			const { data } = await playlistsControllerUpdate({
				...variables,
				body,
			});
			if (data === undefined) throw new Error('No data');
			return data;
		},
		onSuccess: (data) => {
			updatePlaylistCache(
				data.id,
				data,
				data.userId
			);
		}
	});
};

export const usePlaylistDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(playlistOptions({ playlistId: data.id }).queryKey, undefined);
			
			removeListItemFromAllCaches(
				queryClient,
				{
					paginated: userPlaylistsPaginatedOptions({ userId: data.userId }).queryKey,
					infinite: userPlaylistsInfiniteOptions({ userId: data.userId }).queryKey,
				},
				data.id
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
					}
				},
				data.id
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
					}
				},
				(old: InfiniteData<ListInfinitePlaylistsWithOwner> | undefined) => {
					return removeFromInfiniteCache(old, data.id);
				}
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
					}
				},
				data.id
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
					}
				},
				(old: InfiniteData<ListInfinitePlaylistsWithOwner> | undefined) => {
					return removeFromInfiniteCache(old, data.id);
				}
			);

			// User Playlists Add Targets
			removeListItemFromAllCaches<
				PlaylistsAddTarget,
				ListPaginatedPlaylistsAddTargets,
				ListInfinitePlaylistsAddTargets
			>(
				queryClient,
				{
					all: { predicate: ({ queryKey }) => queryKey.includes('playlists_add_targets') && queryKey.includes('all') },
					paginated: { predicate: ({ queryKey }) => queryKey.includes('playlists_add_targets') && queryKey.includes('paginated') },
					infinite: { predicate: ({ queryKey }) => queryKey.includes('playlists_add_targets') && queryKey.includes('infinite') },
				},
				data.id
			);

			// Feed
			removeListItemFromAllCaches<
				FeedItem,
				ListPaginatedFeed,
				ListInfiniteFeed
			>(
				queryClient,
				{
					paginated: userFeedPaginatedOptions({ userId: data.userId }).queryKey,
					infinite: userFeedInfiniteOptions({ userId: data.userId }).queryKey,
				},
				(item) => item.activityType === 'playlist_like' && item.content.id === data.id
			);

			// Featured
			removeListItemFromAllCaches(
				queryClient,
				{
					paginated: playlistFeaturedPaginatedOptions().queryKey,
					infinite: playlistFeaturedInfiniteOptions().queryKey,
				},
				data.id
			);

			// Search
			removeListItemFromAllCaches<
				Playlist,
				ListPaginatedPlaylists,
				ListInfinitePlaylists
			>(
				queryClient,
				{
					paginated: searchPlaylistsPaginatedOptions().queryKey,
					infinite: searchPlaylistsInfiniteOptions().queryKey,
				},
				data.id
			);
			queryClient.setQueriesData(
				{
					predicate: (query) => {
						const refKey = searchGlobalOptions().queryKey;
						return query.queryKey[0] === refKey[0] && query.queryKey[1] === refKey[1];
					}
				},
				(old: SearchResponse) => {
					if (!old) return old;
					return {
						...old,
						playlists: old.playlists.filter(playlist => playlist.id !== data.id),
					};
				}
			);
		}
	});
};

/* ---------------------------------- Items --------------------------------- */
export const usePlaylistItemsAddMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	const updatePlaylistCache = usePlaylistCacheUpdate({
		userId,
	});
	return useMutation({
		...playlistsAddControllerAddMutation(),
		onSuccess: (data) => {
			if (!data || data.length === 0) return;
			const mediaId = data[0].mediaId;
			const mediaType = data[0].type;

			updateListItemInAllCaches<
				PlaylistsAddTarget,
				ListPaginatedPlaylistsAddTargets,
				ListInfinitePlaylistsAddTargets
			>(
				queryClient,
				{
					all: userPlaylistsAddTargetsAllOptions({ userId, mediaId, type: mediaType }).queryKey,
					paginated: userPlaylistsAddTargetsPaginatedOptions({ userId, mediaId, type: mediaType }).queryKey,
					infinite: userPlaylistsAddTargetsInfiniteOptions({ userId, mediaId, type: mediaType }).queryKey,
				},
				{ alreadyAdded: true },
				(item) => data.some(added => added.playlistId === item.id)
			);

			data.forEach(item => {
				updatePlaylistCache(
					item.playlistId,
					(prev) => ({ itemsCount: (prev?.itemsCount || 0) + 1 }),
					item.userId
				);
				queryClient.invalidateQueries({
					queryKey: playlistKeys.items({ playlistId: item.playlistId }),
				});
			});
		}
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
                const currentIndex = updatedList.findIndex(item => item.id === itemId);                
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
		onSuccess: (data) => {
			const playlistId = data.playlistId;
			updateListItemInAllCaches<
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
				data,
			);
		}
	});
};
export const usePlaylistItemsDeleteMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	const updatePlaylistCache = usePlaylistCacheUpdate({
		userId,
	});
	return useMutation({
		...playlistItemsControllerDeleteMutation(),
		onSuccess: (data) => {
			if (!data || data.length === 0) return;
			const playlistId = data[0].playlistId;

			data.forEach(item => {
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
					item.id
				);
			});

			updatePlaylistCache(
				playlistId,
				(prev) => ({ itemsCount: Math.max((prev?.itemsCount || 1) - data.length, 0) }),
			);
		}
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
		}
	});
};
export const usePlaylistMembersDeleteMutation = ({
	userId,
}: {
	userId?: string;
}) => {
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
				(item) => data.some(deleted => deleted.userId === item.userId)
			);

			if (userId && data.some(deleted => deleted.userId === userId)) {
				updatePlaylistCache(
					playlistId,
					{ role: null },
					ownerId
				);
			}
		}
	});
};
export const usePlaylistMemberUpdateMutation = ({
	userId,
}: {
	userId?: string;
}) => {
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
				updatePlaylistCache(
					playlistId,
					{ role: data.role },
					data.userId
				);
			}
		}
	});
};
