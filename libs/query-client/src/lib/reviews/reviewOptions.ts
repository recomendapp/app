import { queryOptions } from "@tanstack/react-query";
import { reviewKeys } from "./reviewKeys";
import { reviewsMovieControllerGetLikeStatus, reviewsTvSeriesControllerGetLikeStatus } from "@packages/api-js";

export const reviewMovieLikeOptions = ({
	userId,
	reviewId,
} : {
	userId?: string;
	reviewId?: number;
}) => {
	return queryOptions({
		queryKey: reviewKeys.like({
			id: reviewId!,
			type: 'movie',
		}),
		queryFn: async () => {
			if (!reviewId) throw Error('Review ID is required');
			const { data, error } = await reviewsMovieControllerGetLikeStatus({
				path: {
					review_id: reviewId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!reviewId,
	});
}

export const reviewTvSeriesLikeOptions = ({
	userId,
	reviewId,
} : {
	userId?: string;
	reviewId?: number;
}) => {
	return queryOptions({
		queryKey: reviewKeys.like({
			id: reviewId!,
			type: 'tv-series',
		}),
		queryFn: async () => {
			if (!reviewId) throw Error('Review ID is required');
			const { data, error } = await reviewsTvSeriesControllerGetLikeStatus({
				path: {
					review_id: reviewId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!reviewId,
	});
}
