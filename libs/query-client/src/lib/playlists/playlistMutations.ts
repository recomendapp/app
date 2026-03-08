import { ListInfinitePlaylistMembers, ListInfinitePlaylistsWithOwner, ListPaginatedPlaylistMembers, playlistMembersControllerAddMutation, playlistMembersControllerDeleteMutation, playlistMembersControllerUpdateMutation, PlaylistMemberWithUser, playlistPosterControllerDeleteMutation, playlistPosterControllerSetMutation, playlistsControllerCreateMutation, playlistsControllerDeleteMutation, playlistsControllerUpdateMutation } from "@packages/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys, userPlaylistsInfiniteOptions, userPlaylistsPaginatedOptions } from "../users";
import { playlistMembersAllOptions, playlistMembersInfiniteOptions, playlistMembersPaginatedOptions, playlistOptions } from "./playlistOptions";
import { removeFromInfiniteCache, removeFromPaginatedCache, removeListItemFromAllCaches, updateListItemInAllCaches } from "../utils";
import { moviePlaylistsInfiniteOptions, moviePlaylistsPaginatedOptions } from "../movies";
import { tvSeriesPlaylistsInfiniteOptions, tvSeriesPlaylistsPaginatedOptions } from "../tv-series";
import { usePlaylistCacheUpdate } from "./playlistHooks";
import { playlistKeys } from "./playlistKeys";

export const usePlaylistInsertMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerCreateMutation(),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: userKeys.playlists({ userId: data.userId }),
			})
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
		...playlistsControllerUpdateMutation(),
		onSuccess: (data) => {
			updatePlaylistCache(data);
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
		}
	});
};

// Poster
export const usePlaylistPoserUpdateMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const updatePlaylistCache = usePlaylistCacheUpdate({
		userId,
	});
	return useMutation({
		...playlistPosterControllerSetMutation(),
		onSuccess: (data) => {
			updatePlaylistCache(data);
		}
	});
};

export const usePlaylistPoserDeleteMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const updatePlaylistCache = usePlaylistCacheUpdate({
		userId,
	});
	return useMutation({
		...playlistPosterControllerDeleteMutation(),
		onSuccess: (data) => {
			updatePlaylistCache(data);
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
				updatePlaylistCache({
					role: null,
				})
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
				updatePlaylistCache({
					role: data.role,
				})
			}
		}
	});
};
