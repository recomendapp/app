import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from "react"
import { reviewMovieLikeOptions, useReviewMovieLikeMutation, useReviewMovieUnlikeMutation } from '../../reviews';

export const useUserReviewMovieLike = ({
	userId,
	reviewId,
}: {
	userId?: string,
	reviewId?: number,
}) => {
	const { data: isLiked, isLoading } = useQuery(reviewMovieLikeOptions({
		userId: userId,
		reviewId,
	}));

	const { mutate: insertLike, isPending: isInserting } = useReviewMovieLikeMutation({
		userId,
	});
	const { mutate: deleteLike, isPending: isDeleting } = useReviewMovieUnlikeMutation({
		userId,
	});
	const isPending = useMemo(() => isInserting || isDeleting, [isInserting, isDeleting])

	const toggle = useCallback(() => {
		if (!userId || !reviewId) return
		if (isPending) return
		if (isLiked) {
			deleteLike({
				path: {
					review_id: reviewId,
				}
			})
		} else {
			insertLike({
				path: {
					review_id: reviewId,
				}
			})
		}
	}, [isLiked, isPending, insertLike, deleteLike, reviewId, userId])

	return {
		isLiked,
		isLoading,
		toggle,
		isPending,
	}
}