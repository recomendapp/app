import { useQueryClient } from "@tanstack/react-query";
import { Playlist, ListPaginatedPlaylists, ListInfinitePlaylists, ListPaginatedPlaylistsWithOwner, ListInfinitePlaylistsWithOwner, PlaylistsAddTarget, ListPaginatedPlaylistsAddTargets, ListInfinitePlaylistsAddTargets } from "@packages/api-js";
import { playlistOptions } from "./playlistOptions";
import { userPlaylistsPaginatedOptions, userPlaylistsInfiniteOptions, userPlaylistsFollowingPaginatedOptions, userPlaylistsFollowingInfiniteOptions } from "../users";
import { moviePlaylistsPaginatedOptions, moviePlaylistsInfiniteOptions } from "../movies";
import { tvSeriesPlaylistsPaginatedOptions, tvSeriesPlaylistsInfiniteOptions } from "../tv-series";
import { updateListItemInAllCaches, ItemUpdater, resolveUpdater } from "../utils";

export const usePlaylistCacheUpdate = ({
    userId,
}: {
    userId?: string;
} = {}) => {
    const queryClient = useQueryClient();
    
    return (playlistId: number, updater: ItemUpdater<Playlist>, playlistOwnerId?: string) => {
        
        const targetUserId = playlistOwnerId || userId;

        queryClient.setQueryData(playlistOptions({ playlistId }).queryKey, (old) => {
            if (!old) return undefined;
            return {
                ...old,
                ...resolveUpdater(old, updater),
            }
        });

        // 1. User Playlists
        if (targetUserId) {
            updateListItemInAllCaches<
                Playlist,
                ListPaginatedPlaylists,
                ListInfinitePlaylists
            >(
                queryClient,
                {
                    paginated: userPlaylistsPaginatedOptions({ userId: targetUserId }).queryKey,
                    infinite: userPlaylistsInfiniteOptions({ userId: targetUserId }).queryKey,
                },
                updater,
                playlistId
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
                playlistId
            );
        };

        // 4. Playlists Add Targets
        updateListItemInAllCaches<
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
            updater,
            playlistId
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
                    }
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
                    }
                }
            },
            updater,
            playlistId
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
                    }
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
                    }
                }
            },
            updater,
            playlistId
        );
    };
};