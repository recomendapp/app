import { ListBookmarks, tvSeriesBookmarkControllerDeleteMutation, tvSeriesBookmarkControllerSetMutation } from "@packages/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { tvSeriesBookmarkOptions } from "./tvSeriesOptions";
import { userBookmarksOptions } from "../users";

/* -------------------------------- Bookmarks ------------------------------- */
export const useTvSeriesBookmarkSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...tvSeriesBookmarkControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(tvSeriesBookmarkOptions({
				userId: data.userId,
				tvSeriesId: data.mediaId,
			}).queryKey, data);

			queryClient.invalidateQueries({
				queryKey: userBookmarksOptions({
					userId: data.userId,
				}).queryKey,
			});
		}
	});
}

export const useTvSeriesBookmarkDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...tvSeriesBookmarkControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(tvSeriesBookmarkOptions({
				userId: data.userId,
				tvSeriesId: data.mediaId,
			}).queryKey, null);

			queryClient.setQueriesData(
				{ queryKey: userBookmarksOptions({ userId: data.userId }).queryKey },
				(oldData: InfiniteData<ListBookmarks> | undefined) => {
					if (!oldData || !oldData.pages) return oldData;
					return {
						...oldData,
						pages: oldData.pages.map((page) => ({
							...page,
							data: page.data.filter((item) => !(item.mediaId === data.mediaId && item.type === 'tv_series' && item.status === 'active')),
						}))
					};
				}
			);
		}
	});
}