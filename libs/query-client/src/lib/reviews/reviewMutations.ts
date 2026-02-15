import { reviewsMovieControllerLikeMutation, reviewsMovieControllerUnlikeMutation } from "@packages/api-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewMovieLikeOptions } from "./reviewOptions";

export const useReviewMovieLikeMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...reviewsMovieControllerLikeMutation(),
		onMutate: async ({ path: { review_id } }) => {
			const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
			await queryClient.cancelQueries({ queryKey: options.queryKey });
			const previous = queryClient.getQueryData(options.queryKey);
			queryClient.setQueryData(options.queryKey, true);
			return { previous };
		},
		onError: (_err, _variables, context) => {
			if (context?.previous) {
				const { path: { review_id } } = _variables;
				const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
				queryClient.setQueryData(options.queryKey, context.previous);
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData(reviewMovieLikeOptions({
				userId: data.userId,
				reviewId: data.reviewId,
			}).queryKey, true);
		}
	});
}

export const useReviewMovieUnlikeMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...reviewsMovieControllerUnlikeMutation(),
		onMutate: async ({ path: { review_id } }) => {
			const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
			await queryClient.cancelQueries({ queryKey: options.queryKey });
			const previous = queryClient.getQueryData(options.queryKey);
			queryClient.setQueryData(options.queryKey, false);
			return { previous };
		},
		onError: (_err, _variables, context) => {
			if (context?.previous) {
				const { path: { review_id } } = _variables;
				const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
				queryClient.setQueryData(options.queryKey, context.previous);
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData(reviewMovieLikeOptions({
				userId: data.userId,
				reviewId: data.reviewId,
			}).queryKey, false);
		}
	});
}