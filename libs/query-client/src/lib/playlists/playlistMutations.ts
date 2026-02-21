import { ListInfinitePlaylists, ListInfinitePlaylistsWithOwner, ListPlaylists, ListPlaylistsWithOwner, playlistsControllerCreateMutation, playlistsControllerDeleteMutation, playlistsControllerUpdateMembersMutation, playlistsControllerUpdateMutation } from "@packages/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys, userPlaylistsInfiniteOptions, userPlaylistsOptions } from "../users";
import { playlistMembersOptions, playlistOptions } from "./playlistOptions";
import { removeFromInfiniteCache, removeFromPaginatedCache, updateFromInfiniteCache, updateFromPaginatedCache } from "../utils";
import { moviePlaylistsInfiniteOptions, moviePlaylistsOptions } from "../movies";
import { tvSeriesPlaylistsInfiniteOptions, tvSeriesPlaylistsOptions } from "../tv-series";

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

export const usePlaylistUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerUpdateMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(playlistOptions({ playlistId: data.id }).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					...data,
				}
			});
			// Update playlist in user playlists queries
			queryClient.setQueriesData(
				{ queryKey: userPlaylistsOptions({ userId: data.userId }).queryKey },
				(old: InfiniteData<ListPlaylists> | undefined) => {
					return updateFromPaginatedCache(old, data);
				}
			);
			queryClient.setQueriesData(
				{ queryKey: userPlaylistsInfiniteOptions({ userId: data.userId }).queryKey },
				(old: InfiniteData<ListInfinitePlaylists> | undefined) => {
					return updateFromInfiniteCache(old, data);
				}
			);

			// Update playlist in movies queries
			queryClient.setQueriesData(
				{
					predicate: ({ queryKey }) => {
						const refKey = moviePlaylistsOptions({ movieId: -1 }).queryKey;
						return (
							queryKey[0] === refKey[0] &&
							typeof queryKey[1] === typeof refKey[1] &&
							queryKey[2] === refKey[2] &&
							queryKey[3] === refKey[3]
						);
					}
				},
				(old: InfiniteData<ListPlaylistsWithOwner> | undefined) => {
					return updateFromPaginatedCache(old, data);
				}
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
					return updateFromInfiniteCache(old, data);
				}
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
			
			removeFromPaginatedCache(
				queryClient,
				userPlaylistsOptions({ userId: data.userId }).queryKey,
				data.id
			);
			queryClient.setQueriesData(
				{ queryKey: userPlaylistsInfiniteOptions({ userId: data.userId }).queryKey },
				(old: InfiniteData<ListInfinitePlaylists> | undefined) => {
					return removeFromInfiniteCache(old, data.id);
				}
			);

			// Movies
			removeFromPaginatedCache(
				queryClient,
				{
					predicate: ({ queryKey }) => {
						const refKey = moviePlaylistsOptions({ movieId: -1 }).queryKey;
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
						const refKey = tvSeriesPlaylistsOptions({ tvSeriesId: -1 }).queryKey;
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

// Members
export const usePlaylistMembersUpdateMutation = ({
	playlistId,
}: {
	playlistId?: number;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerUpdateMembersMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(playlistMembersOptions({ playlistId: playlistId }).queryKey, data);
		}
	});
};