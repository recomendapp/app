import {
  reviewMovieLikesControllerLikeMutation,
  reviewMovieLikesControllerUnlikeMutation,
  reviewTvSeriesLikesControllerLikeMutation,
  reviewTvSeriesLikesControllerUnlikeMutation,
  reviewMovieCommentsControllerCreateMutation,
  reviewMovieCommentsControllerUpdateMutation,
  reviewMovieCommentsControllerDeleteMutation,
  reviewMovieCommentLikesControllerLikeMutation,
  reviewMovieCommentLikesControllerUnlikeMutation,
  reviewTvSeriesCommentsControllerCreateMutation,
  reviewTvSeriesCommentsControllerUpdateMutation,
  reviewTvSeriesCommentsControllerDeleteMutation,
  reviewTvSeriesCommentLikesControllerLikeMutation,
  reviewTvSeriesCommentLikesControllerUnlikeMutation,
} from '@libs/api-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reviewMovieLikeOptions,
  reviewTvSeriesLikeOptions,
  reviewMovieCommentLikeOptions,
  reviewTvSeriesCommentLikeOptions,
} from './reviewOptions';
import { reviewMovieKeys, reviewTvSeriesKeys } from './reviewKeys';
import { updateListItemInAllCaches } from '../utils';
import {
  useReviewMovieCountsCacheUpdate,
  useReviewTvSeriesCountsCacheUpdate,
  useReviewMovieCommentsCacheUpdate,
  useReviewTvSeriesCommentsCacheUpdate,
} from './reviewHooks';

// Note: the review like/unlike response never carries the review's updated
// likesCount (it's maintained by a DB trigger, not returned by the endpoint),
// and movieId/reviewAuthorId aren't part of the path or response either - so
// they're supplied at hook-instantiation time (the caller already has the full
// review object) and closed over here, the same way `userId` already is. This
// keeps the "patch likesCount everywhere the review is cached" logic in one
// place shared by every consumer (web now, mobile later) instead of having
// each screen re-implement it in its own onSuccess.
export const useReviewMovieLikeMutation = ({
  userId,
  movieId,
  reviewAuthorId,
}: {
  userId?: string;
  movieId: number;
  reviewAuthorId: string;
}) => {
  const queryClient = useQueryClient();
  const { patchLikesCount } = useReviewMovieCountsCacheUpdate();
  return useMutation({
    ...reviewMovieLikesControllerLikeMutation(),
    onMutate: async ({ path: { review_id } }) => {
      const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, true);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id },
        } = _variables;
        const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        reviewMovieLikeOptions({
          userId: data.userId,
          reviewId: data.reviewId,
        }).queryKey,
        true,
      );
      patchLikesCount({ movieId, userId: reviewAuthorId, reviewId: data.reviewId, delta: 1 });
    },
  });
};

export const useReviewMovieUnlikeMutation = ({
  userId,
  movieId,
  reviewAuthorId,
}: {
  userId?: string;
  movieId: number;
  reviewAuthorId: string;
}) => {
  const queryClient = useQueryClient();
  const { patchLikesCount } = useReviewMovieCountsCacheUpdate();
  return useMutation({
    ...reviewMovieLikesControllerUnlikeMutation(),
    onMutate: async ({ path: { review_id } }) => {
      const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, false);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id },
        } = _variables;
        const options = reviewMovieLikeOptions({ userId, reviewId: review_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        reviewMovieLikeOptions({
          userId: data.userId,
          reviewId: data.reviewId,
        }).queryKey,
        false,
      );
      patchLikesCount({ movieId, userId: reviewAuthorId, reviewId: data.reviewId, delta: -1 });
    },
  });
};

export const useReviewTvSeriesLikeMutation = ({
  userId,
  tvSeriesId,
  reviewAuthorId,
}: {
  userId?: string;
  tvSeriesId: number;
  reviewAuthorId: string;
}) => {
  const queryClient = useQueryClient();
  const { patchLikesCount } = useReviewTvSeriesCountsCacheUpdate();
  return useMutation({
    ...reviewTvSeriesLikesControllerLikeMutation(),
    onMutate: async ({ path: { review_id } }) => {
      const options = reviewTvSeriesLikeOptions({ userId, reviewId: review_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, true);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id },
        } = _variables;
        const options = reviewTvSeriesLikeOptions({ userId, reviewId: review_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        reviewTvSeriesLikeOptions({
          userId: data.userId,
          reviewId: data.reviewId,
        }).queryKey,
        true,
      );
      patchLikesCount({ tvSeriesId, userId: reviewAuthorId, reviewId: data.reviewId, delta: 1 });
    },
  });
};

export const useReviewTvSeriesUnlikeMutation = ({
  userId,
  tvSeriesId,
  reviewAuthorId,
}: {
  userId?: string;
  tvSeriesId: number;
  reviewAuthorId: string;
}) => {
  const queryClient = useQueryClient();
  const { patchLikesCount } = useReviewTvSeriesCountsCacheUpdate();
  return useMutation({
    ...reviewTvSeriesLikesControllerUnlikeMutation(),
    onMutate: async ({ path: { review_id } }) => {
      const options = reviewTvSeriesLikeOptions({ userId, reviewId: review_id });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, false);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id },
        } = _variables;
        const options = reviewTvSeriesLikeOptions({ userId, reviewId: review_id });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        reviewTvSeriesLikeOptions({
          userId: data.userId,
          reviewId: data.reviewId,
        }).queryKey,
        false,
      );
      patchLikesCount({ tvSeriesId, userId: reviewAuthorId, reviewId: data.reviewId, delta: -1 });
    },
  });
};

/* --------------------------------- Comments -------------------------------- */
// Same reasoning as the review-level likes: the create/delete response doesn't
// carry the review's updated commentsCount (DB trigger, not endpoint output),
// so movieId/reviewAuthorId are supplied at hook-instantiation time. Cache
// insertion/removal (addComment/deleteComment) is also centralized here so
// callers just call the mutation - no separate cache-update call needed.
export const useReviewMovieCommentCreateMutation = ({
  movieId,
  reviewAuthorId,
}: {
  movieId: number;
  reviewAuthorId: string;
}) => {
  const { addComment } = useReviewMovieCommentsCacheUpdate();
  const { patchCommentsCount } = useReviewMovieCountsCacheUpdate();
  return useMutation({
    ...reviewMovieCommentsControllerCreateMutation(),
    onSuccess: (comment) => {
      addComment(comment);
      patchCommentsCount({ movieId, userId: reviewAuthorId, reviewId: comment.reviewId, delta: 1 });
    },
  });
};

export const useReviewMovieCommentUpdateMutation = () => {
  const { updateComment } = useReviewMovieCommentsCacheUpdate();
  return useMutation({
    ...reviewMovieCommentsControllerUpdateMutation(),
    onSuccess: (comment) => {
      updateComment(comment);
    },
  });
};

export const useReviewMovieCommentDeleteMutation = ({
  movieId,
  reviewAuthorId,
}: {
  movieId: number;
  reviewAuthorId: string;
}) => {
  const { deleteComment } = useReviewMovieCommentsCacheUpdate();
  const { patchCommentsCount } = useReviewMovieCountsCacheUpdate();
  return useMutation({
    ...reviewMovieCommentsControllerDeleteMutation(),
    onSuccess: (comment) => {
      deleteComment(comment);
      patchCommentsCount({
        movieId,
        userId: reviewAuthorId,
        reviewId: comment.reviewId,
        delta: -1,
      });
    },
  });
};

export const useReviewTvSeriesCommentCreateMutation = ({
  tvSeriesId,
  reviewAuthorId,
}: {
  tvSeriesId: number;
  reviewAuthorId: string;
}) => {
  const { addComment } = useReviewTvSeriesCommentsCacheUpdate();
  const { patchCommentsCount } = useReviewTvSeriesCountsCacheUpdate();
  return useMutation({
    ...reviewTvSeriesCommentsControllerCreateMutation(),
    onSuccess: (comment) => {
      addComment(comment);
      patchCommentsCount({
        tvSeriesId,
        userId: reviewAuthorId,
        reviewId: comment.reviewId,
        delta: 1,
      });
    },
  });
};

export const useReviewTvSeriesCommentUpdateMutation = () => {
  const { updateComment } = useReviewTvSeriesCommentsCacheUpdate();
  return useMutation({
    ...reviewTvSeriesCommentsControllerUpdateMutation(),
    onSuccess: (comment) => {
      updateComment(comment);
    },
  });
};

export const useReviewTvSeriesCommentDeleteMutation = ({
  tvSeriesId,
  reviewAuthorId,
}: {
  tvSeriesId: number;
  reviewAuthorId: string;
}) => {
  const { deleteComment } = useReviewTvSeriesCommentsCacheUpdate();
  const { patchCommentsCount } = useReviewTvSeriesCountsCacheUpdate();
  return useMutation({
    ...reviewTvSeriesCommentsControllerDeleteMutation(),
    onSuccess: (comment) => {
      deleteComment(comment);
      patchCommentsCount({
        tvSeriesId,
        userId: reviewAuthorId,
        reviewId: comment.reviewId,
        delta: -1,
      });
    },
  });
};

/* ----------------------------- Comment likes ------------------------------ */
// Note: the comment-like response only carries { commentId, userId, createdAt },
// so review_id is taken from the mutation variables (path), not from the response.
// A liked comment can be a top-level comment or a reply - those live in different
// caches (reviewMovieKeys.comments vs reviewMovieKeys.commentReplies), and the
// response doesn't say which one it is, so the caller passes parentId (it already
// has the full comment object) the same way review-likes get movieId/reviewAuthorId.
const getMovieCommentListCacheFilters = (reviewId: number, parentId?: number | null) => {
  if (parentId == null) {
    return {
      paginated: reviewMovieKeys.comments({ id: reviewId, mode: 'paginated' }),
      infinite: reviewMovieKeys.comments({ id: reviewId, mode: 'infinite' }),
    };
  }
  return {
    paginated: reviewMovieKeys.commentReplies({
      id: reviewId,
      commentId: parentId,
      mode: 'paginated',
    }),
    infinite: reviewMovieKeys.commentReplies({
      id: reviewId,
      commentId: parentId,
      mode: 'infinite',
    }),
  };
};

const getTvSeriesCommentListCacheFilters = (reviewId: number, parentId?: number | null) => {
  if (parentId == null) {
    return {
      paginated: reviewTvSeriesKeys.comments({ id: reviewId, mode: 'paginated' }),
      infinite: reviewTvSeriesKeys.comments({ id: reviewId, mode: 'infinite' }),
    };
  }
  return {
    paginated: reviewTvSeriesKeys.commentReplies({
      id: reviewId,
      commentId: parentId,
      mode: 'paginated',
    }),
    infinite: reviewTvSeriesKeys.commentReplies({
      id: reviewId,
      commentId: parentId,
      mode: 'infinite',
    }),
  };
};

export const useReviewMovieCommentLikeMutation = ({
  userId,
  parentId,
}: {
  userId?: string;
  parentId?: number | null;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...reviewMovieCommentLikesControllerLikeMutation(),
    onMutate: async ({ path: { review_id, comment_id } }) => {
      const options = reviewMovieCommentLikeOptions({
        userId,
        reviewId: review_id,
        commentId: comment_id,
      });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, true);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id, comment_id },
        } = _variables;
        const options = reviewMovieCommentLikeOptions({
          userId,
          reviewId: review_id,
          commentId: comment_id,
        });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (_data, { path: { review_id, comment_id } }) => {
      queryClient.setQueryData(
        reviewMovieCommentLikeOptions({ userId, reviewId: review_id, commentId: comment_id })
          .queryKey,
        true,
      );
      updateListItemInAllCaches(
        queryClient,
        getMovieCommentListCacheFilters(review_id, parentId),
        (item: { likesCount: number }) => ({ likesCount: item.likesCount + 1 }),
        comment_id,
      );
    },
  });
};

export const useReviewMovieCommentUnlikeMutation = ({
  userId,
  parentId,
}: {
  userId?: string;
  parentId?: number | null;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...reviewMovieCommentLikesControllerUnlikeMutation(),
    onMutate: async ({ path: { review_id, comment_id } }) => {
      const options = reviewMovieCommentLikeOptions({
        userId,
        reviewId: review_id,
        commentId: comment_id,
      });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, false);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id, comment_id },
        } = _variables;
        const options = reviewMovieCommentLikeOptions({
          userId,
          reviewId: review_id,
          commentId: comment_id,
        });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (_data, { path: { review_id, comment_id } }) => {
      queryClient.setQueryData(
        reviewMovieCommentLikeOptions({ userId, reviewId: review_id, commentId: comment_id })
          .queryKey,
        false,
      );
      updateListItemInAllCaches(
        queryClient,
        getMovieCommentListCacheFilters(review_id, parentId),
        (item: { likesCount: number }) => ({ likesCount: Math.max(0, item.likesCount - 1) }),
        comment_id,
      );
    },
  });
};

export const useReviewTvSeriesCommentLikeMutation = ({
  userId,
  parentId,
}: {
  userId?: string;
  parentId?: number | null;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...reviewTvSeriesCommentLikesControllerLikeMutation(),
    onMutate: async ({ path: { review_id, comment_id } }) => {
      const options = reviewTvSeriesCommentLikeOptions({
        userId,
        reviewId: review_id,
        commentId: comment_id,
      });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, true);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id, comment_id },
        } = _variables;
        const options = reviewTvSeriesCommentLikeOptions({
          userId,
          reviewId: review_id,
          commentId: comment_id,
        });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (_data, { path: { review_id, comment_id } }) => {
      queryClient.setQueryData(
        reviewTvSeriesCommentLikeOptions({ userId, reviewId: review_id, commentId: comment_id })
          .queryKey,
        true,
      );
      updateListItemInAllCaches(
        queryClient,
        getTvSeriesCommentListCacheFilters(review_id, parentId),
        (item: { likesCount: number }) => ({ likesCount: item.likesCount + 1 }),
        comment_id,
      );
    },
  });
};

export const useReviewTvSeriesCommentUnlikeMutation = ({
  userId,
  parentId,
}: {
  userId?: string;
  parentId?: number | null;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...reviewTvSeriesCommentLikesControllerUnlikeMutation(),
    onMutate: async ({ path: { review_id, comment_id } }) => {
      const options = reviewTvSeriesCommentLikeOptions({
        userId,
        reviewId: review_id,
        commentId: comment_id,
      });
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      queryClient.setQueryData(options.queryKey, false);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context && context.previous !== undefined) {
        const {
          path: { review_id, comment_id },
        } = _variables;
        const options = reviewTvSeriesCommentLikeOptions({
          userId,
          reviewId: review_id,
          commentId: comment_id,
        });
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (_data, { path: { review_id, comment_id } }) => {
      queryClient.setQueryData(
        reviewTvSeriesCommentLikeOptions({ userId, reviewId: review_id, commentId: comment_id })
          .queryKey,
        false,
      );
      updateListItemInAllCaches(
        queryClient,
        getTvSeriesCommentListCacheFilters(review_id, parentId),
        (item: { likesCount: number }) => ({ likesCount: Math.max(0, item.likesCount - 1) }),
        comment_id,
      );
    },
  });
};
