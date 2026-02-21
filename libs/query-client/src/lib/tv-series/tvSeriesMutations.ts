import { ListInfiniteBookmarks, tvSeriesBookmarksControllerDeleteMutation, tvSeriesBookmarksControllerSetMutation } from "@packages/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { tvSeriesBookmarkOptions } from "./tvSeriesOptions";
import { userBookmarksInfiniteOptions, userBookmarksOptions, userKeys } from "../users";
import { removeFromInfiniteCache, removeFromPaginatedCache } from "../utils";

/* -------------------------------- Bookmarks ------------------------------- */
export const useTvSeriesBookmarkSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...tvSeriesBookmarksControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(tvSeriesBookmarkOptions({
				userId: data.userId,
				tvSeriesId: data.mediaId,
			}).queryKey, data);

			queryClient.invalidateQueries({
				queryKey: userKeys.bookmarks({
					userId: data.userId,
				}),
			});
		}
	});
}

export const useTvSeriesBookmarkDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...tvSeriesBookmarksControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(tvSeriesBookmarkOptions({
				userId: data.userId,
				tvSeriesId: data.mediaId,
			}).queryKey, null);

			removeFromPaginatedCache(
				queryClient,
				userBookmarksOptions({ userId: data.userId }).queryKey,
				data.id
			);
			queryClient.setQueriesData(
				{ queryKey: userBookmarksInfiniteOptions({ userId: data.userId }).queryKey },
				(oldData: InfiniteData<ListInfiniteBookmarks> | undefined) => {
					return removeFromInfiniteCache(oldData, data.id);
				}
			);
		}
	});
}