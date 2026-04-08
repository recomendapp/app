import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
    ListPaginatedBookmarks,
    ListInfiniteBookmarks,
    ListPaginatedUserTvSeriesWithTvSeries,
    ListInfiniteUserTvSeriesWithTvSeries,
	LogTvSeriesWithTvSeriesNoReview,
	LogTvSeries,
    FeedItem,
    ListPaginatedFeed,
    ListInfiniteFeed,
} from "@libs/api-js";
import { tvSeriesLogOptions, tvSeriesReviewsInfiniteOptions, tvSeriesReviewsPaginatedOptions } from "./tvSeriesOptions";
import { 
    userKeys, 
    userTvSeriesLogOptions, 
    userTvSeriesLogsPaginatedOptions, 
    userTvSeriesLogsInfiniteOptions, 
    userBookmarkByMediaOptions,
    userFeedPaginatedOptions,
    userFeedInfiniteOptions
} from "../users";
import { removeListItemFromAllCaches, updateListItemInAllCaches } from "../utils";
import { BookmarkWithMedia } from "../users/types";

export const useTvSeriesLogCacheUpdate = ({
    currentUserId,
}: {
    currentUserId?: string;
} = {}) => {
    const queryClient = useQueryClient();

    const updateLog = useCallback((data: LogTvSeries, targetUserId?: string) => {
        const userId = targetUserId || currentUserId || data.userId;
        if (!userId) return;

        const tvSeriesId = data.tvSeriesId;

        queryClient.setQueryData(tvSeriesLogOptions({ userId, tvSeriesId }).queryKey, data);

        const userLogKey = userTvSeriesLogOptions({ userId, tvSeriesId }).queryKey;
        const oldUserLog = queryClient.getQueryData(userLogKey);
        
        if (!oldUserLog) {
            queryClient.invalidateQueries({ queryKey: userLogKey });
        } else {
            queryClient.setQueryData(userLogKey, {
                ...oldUserLog,
                ...data,
            });
        }

        queryClient.setQueryData(userBookmarkByMediaOptions({
            userId,
            mediaId: tvSeriesId,
            type: 'tv_series',
        }).queryKey, null);
        
        removeListItemFromAllCaches<
            BookmarkWithMedia,
            ListPaginatedBookmarks,
            ListInfiniteBookmarks
        >(
            queryClient,
            {
                all: userKeys.bookmarks({ userId, mode: 'all' }),
                paginated: userKeys.bookmarks({ userId, mode: 'paginated' }),
                infinite: userKeys.bookmarks({ userId, mode: 'infinite' }),
            },
            data.id
        );

        const isNewLog = data.createdAt === data.updatedAt;
        
        if (isNewLog) {
            queryClient.invalidateQueries({
                queryKey: userKeys.tvSeries({ userId }),
            });
            queryClient.invalidateQueries({
                queryKey: userKeys.feed({ userId }),
            });
        } else {
            updateListItemInAllCaches<
                LogTvSeriesWithTvSeriesNoReview,
                ListPaginatedUserTvSeriesWithTvSeries,
                ListInfiniteUserTvSeriesWithTvSeries
            >(
                queryClient,
                {
                    paginated: userTvSeriesLogsPaginatedOptions({ userId }).queryKey,
                    infinite: userTvSeriesLogsInfiniteOptions({ userId }).queryKey,
                },
                data
            );

            updateListItemInAllCaches<
                FeedItem,
                ListPaginatedFeed,
                ListInfiniteFeed
            >(
                queryClient,
                {
                    paginated: userFeedPaginatedOptions({ userId: userId }).queryKey,
                    infinite: userFeedInfiniteOptions({ userId: userId }).queryKey,
                },
                (old) => {
                    if (old.activityType !== 'log_tv_series') return old;
                    return {
                        ...old,
                        content: {
                            ...old.content,
                            ...data,
                        }
                    }
                },
                (item) => item.activityType === 'log_tv_series' && item.content.id === data.id
            );
        }
    }, [currentUserId, queryClient]);

    const deleteLog = useCallback((data: LogTvSeries, targetUserId?: string) => {
        const userId = targetUserId || currentUserId || data.userId;
        if (!userId) return;

        const tvSeriesId = data.tvSeriesId;

        queryClient.setQueryData(tvSeriesLogOptions({ userId, tvSeriesId }).queryKey, null);
        queryClient.setQueryData(userTvSeriesLogOptions({ userId, tvSeriesId }).queryKey, null);

        if (data.review) {
            removeListItemFromAllCaches(
                queryClient,
                {
                    paginated: tvSeriesReviewsPaginatedOptions({ tvSeriesId }).queryKey,
                    infinite: tvSeriesReviewsInfiniteOptions({ tvSeriesId }).queryKey,
                },
                data.review.id
            );
        }

        removeListItemFromAllCaches(
            queryClient,
            {
                paginated: userTvSeriesLogsPaginatedOptions({ userId }).queryKey,
                infinite: userTvSeriesLogsInfiniteOptions({ userId }).queryKey,
            },
            data.id
        );

        // Feed
        removeListItemFromAllCaches(
            queryClient,
            {
                paginated: userFeedPaginatedOptions({ userId: data.userId }).queryKey,
                infinite: userFeedInfiniteOptions({ userId: data.userId }).queryKey,
            },
            (old: FeedItem) => old.activityType === 'log_tv_series' && old.content.id === data.id
        );
    }, [currentUserId, queryClient]);

    return { updateLog, deleteLog };
};