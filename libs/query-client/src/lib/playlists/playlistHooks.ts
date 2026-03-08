import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { Playlist, ListPaginatedPlaylists, ListInfinitePlaylists, ListPaginatedPlaylistsWithOwner, ListInfinitePlaylistsWithOwner } from "@packages/api-js";
import { playlistOptions } from "./playlistOptions";
import { userPlaylistsPaginatedOptions, userPlaylistsInfiniteOptions, userPlaylistsFollowingPaginatedOptions, userPlaylistsFollowingInfiniteOptions } from "../users";
import { moviePlaylistsPaginatedOptions, moviePlaylistsInfiniteOptions } from "../movies";
import { tvSeriesPlaylistsPaginatedOptions, tvSeriesPlaylistsInfiniteOptions } from "../tv-series";
import { updateListItemInAllCaches, updateFromPaginatedCache, updateFromInfiniteCache } from "../utils";

export const usePlaylistCacheUpdate = ({
    userId,
}: {
    userId?: string;
} = {}) => {
    const queryClient = useQueryClient();
    return (updatedPlaylist: Partial<Playlist>) => {
        queryClient.setQueryData(playlistOptions({ playlistId: updatedPlaylist.id }).queryKey, (old) => {
            if (!old) return undefined;
            return {
                ...old,
                ...updatedPlaylist,
            }
        });

        updateListItemInAllCaches<
            Playlist,
            ListPaginatedPlaylists,
            ListInfinitePlaylists
        >(
            queryClient,
            {
                paginated: userPlaylistsPaginatedOptions({ userId: updatedPlaylist.userId }).queryKey,
                infinite: userPlaylistsInfiniteOptions({ userId: updatedPlaylist.userId }).queryKey,
            },
            updatedPlaylist
        );

        if (userId && userId !== updatedPlaylist.userId) {
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
                updatedPlaylist
            );
        };

		// Movies
        queryClient.setQueriesData(
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
            (old: ListPaginatedPlaylistsWithOwner | undefined) => updateFromPaginatedCache(old, updatedPlaylist)
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
            (old: InfiniteData<ListInfinitePlaylistsWithOwner> | undefined) => updateFromInfiniteCache(old, updatedPlaylist)
        );

		// TV Series
        queryClient.setQueriesData(
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
            (old: ListPaginatedPlaylistsWithOwner | undefined) => updateFromPaginatedCache(old, updatedPlaylist)
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
            (old: InfiniteData<ListInfinitePlaylistsWithOwner> | undefined) => updateFromInfiniteCache(old, updatedPlaylist)
        );
    };
};