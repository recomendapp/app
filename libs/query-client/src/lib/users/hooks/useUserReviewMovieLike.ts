import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  reviewMovieLikeOptions,
  useReviewMovieLikeMutation,
  useReviewMovieUnlikeMutation,
} from '../../reviews';

export const useUserReviewMovieLike = ({
  userId,
  reviewId,
  movieId,
  reviewAuthorId,
}: {
  userId?: string;
  reviewId?: number;
  movieId: number;
  reviewAuthorId: string;
}) => {
  const { data: isLiked, isLoading } = useQuery(
    reviewMovieLikeOptions({
      userId: userId,
      reviewId,
    }),
  );

  const { mutate: insertLike, isPending: isInserting } = useReviewMovieLikeMutation({
    userId,
    movieId,
    reviewAuthorId,
  });
  const { mutate: deleteLike, isPending: isDeleting } = useReviewMovieUnlikeMutation({
    userId,
    movieId,
    reviewAuthorId,
  });
  const isPending = useMemo(() => isInserting || isDeleting, [isInserting, isDeleting]);

  const toggle = useCallback(() => {
    if (!userId || !reviewId) return;
    if (isPending) return;
    if (isLiked) {
      deleteLike({
        path: {
          review_id: reviewId,
        },
      });
    } else {
      insertLike({
        path: {
          review_id: reviewId,
        },
      });
    }
  }, [isLiked, isPending, insertLike, deleteLike, reviewId, userId]);

  return {
    isLiked,
    isLoading,
    toggle,
    isPending,
  };
};
