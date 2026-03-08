import { ListInfinitePlaylistsWithOwner, playlistPosterControllerDeleteMutation, playlistPosterControllerSetMutation, playlistsControllerCreateMutation, playlistsControllerDeleteMutation, playlistMembersControllerUpdateAllMutation, playlistsControllerUpdateMutation } from "@packages/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys, userPlaylistsInfiniteOptions, userPlaylistsPaginatedOptions } from "../users";
import { playlistMembersAllOptions, playlistOptions } from "./playlistOptions";
import { removeFromInfiniteCache, removeFromPaginatedCache, removeListItemFromAllCaches } from "../utils";
import { moviePlaylistsInfiniteOptions, moviePlaylistsPaginatedOptions } from "../movies";
import { tvSeriesPlaylistsInfiniteOptions, tvSeriesPlaylistsPaginatedOptions } from "../tv-series";
import { usePlaylistCacheUpdate } from "./playlistHooks";

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
	const updatePlaylistCache = usePlaylistCacheUpdate();
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
export const usePlaylistPoserUpdateMutation = () => {
	const updatePlaylistCache = usePlaylistCacheUpdate();
	return useMutation({
		...playlistPosterControllerSetMutation(),
		onSuccess: (data) => {
			updatePlaylistCache(data);
		}
	});
};

export const usePlaylistPoserDeleteMutation = () => {
	const updatePlaylistCache = usePlaylistCacheUpdate();
	return useMutation({
		...playlistPosterControllerDeleteMutation(),
		onSuccess: (data) => {
			updatePlaylistCache(data);
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
		...playlistMembersControllerUpdateAllMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(playlistMembersAllOptions({ playlistId: playlistId }).queryKey, data);
		}
	});
};