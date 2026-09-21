import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ReviewMovieCommentWithAuthor,
  ListPaginatedReviewMovieComments,
  ListInfiniteReviewMovieComments,
  ReviewTvSeriesCommentWithAuthor,
  ListPaginatedReviewTvSeriesComments,
  ListInfiniteReviewTvSeriesComments,
  ReviewMovie,
  ReviewMovieWithAuthor,
  ListPaginatedReviewsMovie,
  ListInfiniteReviewsMovie,
  ReviewTvSeries,
  ReviewTvSeriesWithAuthor,
  ListPaginatedReviewsTvSeries,
  ListInfiniteReviewsTvSeries,
  FeedItem,
  ListPaginatedFeed,
  ListInfiniteFeed,
} from '@libs/api-js';
import {
  updateListItemInAllCaches,
  removeListItemFromAllCaches,
  prependListItemToAllCaches,
  updateOrRemoveListItemInAllCaches,
} from '../utils';
import { reviewMovieKeys, reviewTvSeriesKeys } from './reviewKeys';
import { movieKeys, movieLogOptions } from '../movies';
import { tvSeriesKeys, tvSeriesLogOptions } from '../tv-series';
import { userMovieLogOptions, userTvSeriesLogOptions } from '../users';
import { meFeedInfiniteOptions, meFeedPaginatedOptions } from '../me';

/**
 * Cache updates for movie review comments. Not wired automatically into the
 * mutations (create/update/delete) - call these explicitly from the mutation's
 * onSuccess, mirroring useMovieReviewCacheUpdate.
 */
export const useReviewMovieCommentsCacheUpdate = () => {
  const queryClient = useQueryClient();

  const updateComment = useCallback(
    (comment: ReviewMovieCommentWithAuthor) => {
      const filters =
        comment.parentId == null
          ? {
              paginated: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
              infinite: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
            }
          : {
              paginated: reviewMovieKeys.commentReplies({
                id: comment.reviewId,
                commentId: comment.parentId,
                mode: 'paginated',
              }),
              infinite: reviewMovieKeys.commentReplies({
                id: comment.reviewId,
                commentId: comment.parentId,
                mode: 'infinite',
              }),
            };

      updateListItemInAllCaches<
        ReviewMovieCommentWithAuthor,
        ListPaginatedReviewMovieComments,
        ListInfiniteReviewMovieComments
      >(queryClient, filters, comment, comment.id);
    },
    [queryClient],
  );

  const addComment = useCallback(
    (comment: ReviewMovieCommentWithAuthor) => {
      if (comment.parentId == null) {
        prependListItemToAllCaches<
          ReviewMovieCommentWithAuthor,
          ListPaginatedReviewMovieComments,
          ListInfiniteReviewMovieComments
        >(
          queryClient,
          {
            paginated: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
            infinite: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
          },
          comment,
        );
        return;
      }

      const parentId = comment.parentId;

      prependListItemToAllCaches<
        ReviewMovieCommentWithAuthor,
        ListPaginatedReviewMovieComments,
        ListInfiniteReviewMovieComments
      >(
        queryClient,
        {
          paginated: reviewMovieKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'paginated',
          }),
          infinite: reviewMovieKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'infinite',
          }),
        },
        comment,
      );

      updateListItemInAllCaches<
        ReviewMovieCommentWithAuthor,
        ListPaginatedReviewMovieComments,
        ListInfiniteReviewMovieComments
      >(
        queryClient,
        {
          paginated: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
          infinite: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
        },
        (item) => ({ repliesCount: item.repliesCount + 1 }),
        parentId,
      );
    },
    [queryClient],
  );

  const deleteComment = useCallback(
    (comment: ReviewMovieCommentWithAuthor) => {
      if (comment.parentId == null) {
        // Top-level comment: stays (body masked) only if it still has replies.
        if (comment.repliesCount > 0) {
          updateComment(comment);
        } else {
          removeListItemFromAllCaches<
            ReviewMovieCommentWithAuthor,
            ListPaginatedReviewMovieComments,
            ListInfiniteReviewMovieComments
          >(
            queryClient,
            {
              paginated: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
              infinite: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
            },
            comment.id,
          );
        }
        return;
      }

      // Reply: always hard-deleted server-side, so always removed from its
      // parent's replies cache (never just masked in place).
      const parentId = comment.parentId;

      removeListItemFromAllCaches<
        ReviewMovieCommentWithAuthor,
        ListPaginatedReviewMovieComments,
        ListInfiniteReviewMovieComments
      >(
        queryClient,
        {
          paginated: reviewMovieKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'paginated',
          }),
          infinite: reviewMovieKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'infinite',
          }),
        },
        comment.id,
      );

      // A soft-deleted parent only stays visible while it has replies (mirrors
      // the server's getTopLevelWhereClause) - once its last reply is gone,
      // drop it from the cache instead of leaving it stuck at "0 replies".
      updateOrRemoveListItemInAllCaches<
        ReviewMovieCommentWithAuthor,
        ListPaginatedReviewMovieComments,
        ListInfiniteReviewMovieComments
      >(
        queryClient,
        {
          paginated: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
          infinite: reviewMovieKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
        },
        (item) => item.id === parentId,
        (item) => {
          const repliesCount = Math.max(0, item.repliesCount - 1);
          return item.deletedAt && repliesCount === 0 ? null : { repliesCount };
        },
      );
    },
    [queryClient, updateComment],
  );

  return { addComment, updateComment, deleteComment };
};

/**
 * Cache updates for tv series review comments. Not wired automatically into the
 * mutations (create/update/delete) - call these explicitly from the mutation's
 * onSuccess, mirroring useMovieReviewCacheUpdate.
 */
export const useReviewTvSeriesCommentsCacheUpdate = () => {
  const queryClient = useQueryClient();

  const updateComment = useCallback(
    (comment: ReviewTvSeriesCommentWithAuthor) => {
      const filters =
        comment.parentId == null
          ? {
              paginated: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
              infinite: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
            }
          : {
              paginated: reviewTvSeriesKeys.commentReplies({
                id: comment.reviewId,
                commentId: comment.parentId,
                mode: 'paginated',
              }),
              infinite: reviewTvSeriesKeys.commentReplies({
                id: comment.reviewId,
                commentId: comment.parentId,
                mode: 'infinite',
              }),
            };

      updateListItemInAllCaches<
        ReviewTvSeriesCommentWithAuthor,
        ListPaginatedReviewTvSeriesComments,
        ListInfiniteReviewTvSeriesComments
      >(queryClient, filters, comment, comment.id);
    },
    [queryClient],
  );

  const addComment = useCallback(
    (comment: ReviewTvSeriesCommentWithAuthor) => {
      if (comment.parentId == null) {
        prependListItemToAllCaches<
          ReviewTvSeriesCommentWithAuthor,
          ListPaginatedReviewTvSeriesComments,
          ListInfiniteReviewTvSeriesComments
        >(
          queryClient,
          {
            paginated: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
            infinite: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
          },
          comment,
        );
        return;
      }

      const parentId = comment.parentId;

      prependListItemToAllCaches<
        ReviewTvSeriesCommentWithAuthor,
        ListPaginatedReviewTvSeriesComments,
        ListInfiniteReviewTvSeriesComments
      >(
        queryClient,
        {
          paginated: reviewTvSeriesKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'paginated',
          }),
          infinite: reviewTvSeriesKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'infinite',
          }),
        },
        comment,
      );

      updateListItemInAllCaches<
        ReviewTvSeriesCommentWithAuthor,
        ListPaginatedReviewTvSeriesComments,
        ListInfiniteReviewTvSeriesComments
      >(
        queryClient,
        {
          paginated: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
          infinite: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
        },
        (item) => ({ repliesCount: item.repliesCount + 1 }),
        parentId,
      );
    },
    [queryClient],
  );

  const deleteComment = useCallback(
    (comment: ReviewTvSeriesCommentWithAuthor) => {
      if (comment.parentId == null) {
        // Top-level comment: stays (body masked) only if it still has replies.
        if (comment.repliesCount > 0) {
          updateComment(comment);
        } else {
          removeListItemFromAllCaches<
            ReviewTvSeriesCommentWithAuthor,
            ListPaginatedReviewTvSeriesComments,
            ListInfiniteReviewTvSeriesComments
          >(
            queryClient,
            {
              paginated: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
              infinite: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
            },
            comment.id,
          );
        }
        return;
      }

      // Reply: always hard-deleted server-side, so always removed from its
      // parent's replies cache (never just masked in place).
      const parentId = comment.parentId;

      removeListItemFromAllCaches<
        ReviewTvSeriesCommentWithAuthor,
        ListPaginatedReviewTvSeriesComments,
        ListInfiniteReviewTvSeriesComments
      >(
        queryClient,
        {
          paginated: reviewTvSeriesKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'paginated',
          }),
          infinite: reviewTvSeriesKeys.commentReplies({
            id: comment.reviewId,
            commentId: parentId,
            mode: 'infinite',
          }),
        },
        comment.id,
      );

      // A soft-deleted parent only stays visible while it has replies (mirrors
      // the server's getTopLevelWhereClause) - once its last reply is gone,
      // drop it from the cache instead of leaving it stuck at "0 replies".
      updateOrRemoveListItemInAllCaches<
        ReviewTvSeriesCommentWithAuthor,
        ListPaginatedReviewTvSeriesComments,
        ListInfiniteReviewTvSeriesComments
      >(
        queryClient,
        {
          paginated: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'paginated' }),
          infinite: reviewTvSeriesKeys.comments({ id: comment.reviewId, mode: 'infinite' }),
        },
        (item) => item.id === parentId,
        (item) => {
          const repliesCount = Math.max(0, item.repliesCount - 1);
          return item.deletedAt && repliesCount === 0 ? null : { repliesCount };
        },
      );
    },
    [queryClient, updateComment],
  );

  return { addComment, updateComment, deleteComment };
};

/* -------------------------------- Reviews --------------------------------- */
// Neither the like/unlike response nor the comment create/delete response
// carries the review's updated likesCount/commentsCount (both are maintained
// by DB triggers, not returned by those endpoints), so whoever finishes the
// mutation (the like mutation, the comment create/delete mutation) applies the
// delta itself everywhere the review is cached: the log it belongs to (both
// the movie/tv-series-scoped and the user-scoped copy), review lists, and feed
// activities. Centralized here so every mutation - and every future consumer
// (mobile) - gets this for free instead of re-implementing it per screen.

type ReviewMovieCountPatch = {
  movieId: number;
  userId: string;
  reviewId: number;
  delta: number;
};

export const useReviewMovieCountsCacheUpdate = () => {
  const queryClient = useQueryClient();

  const patchCount = useCallback(
    (
      field: 'likesCount' | 'commentsCount',
      { movieId, userId, reviewId, delta }: ReviewMovieCountPatch,
    ) => {
      const patchLog = <T extends { review: ReviewMovie | null } | null | undefined>(old: T): T => {
        if (!old || !old.review || old.review.id !== reviewId) return old;
        return {
          ...old,
          review: { ...old.review, [field]: Math.max(0, old.review[field] + delta) },
        };
      };

      queryClient.setQueryData(movieLogOptions({ movieId, userId }).queryKey, patchLog);
      queryClient.setQueryData(userMovieLogOptions({ userId, movieId }).queryKey, patchLog);

      updateListItemInAllCaches<
        ReviewMovieWithAuthor,
        ListPaginatedReviewsMovie,
        ListInfiniteReviewsMovie
      >(
        queryClient,
        {
          paginated: movieKeys.reviews({ movieId, mode: 'paginated' }),
          infinite: movieKeys.reviews({ movieId, mode: 'infinite' }),
        },
        (item) => ({ [field]: Math.max(0, item[field] + delta) }) as Partial<ReviewMovieWithAuthor>,
        reviewId,
      );

      updateListItemInAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: meFeedPaginatedOptions({ userId }).queryKey,
          infinite: meFeedInfiniteOptions({ userId }).queryKey,
        },
        (item) => {
          if (item.activityType === 'log_movie' && item.content.review?.id === reviewId) {
            return {
              content: {
                ...item.content,
                review: {
                  ...item.content.review,
                  [field]: Math.max(0, item.content.review[field] + delta),
                },
              },
            };
          }
          if (item.activityType === 'review_movie_like' && item.content.id === reviewId) {
            return {
              content: {
                ...item.content,
                [field]: Math.max(0, item.content[field] + delta),
              },
            };
          }
          return item;
        },
        (item) =>
          (item.activityType === 'log_movie' && item.content.review?.id === reviewId) ||
          (item.activityType === 'review_movie_like' && item.content.id === reviewId),
      );
    },
    [queryClient],
  );

  const patchLikesCount = useCallback(
    (patch: ReviewMovieCountPatch) => patchCount('likesCount', patch),
    [patchCount],
  );
  const patchCommentsCount = useCallback(
    (patch: ReviewMovieCountPatch) => patchCount('commentsCount', patch),
    [patchCount],
  );

  return { patchLikesCount, patchCommentsCount };
};

type ReviewTvSeriesCountPatch = {
  tvSeriesId: number;
  userId: string;
  reviewId: number;
  delta: number;
};

export const useReviewTvSeriesCountsCacheUpdate = () => {
  const queryClient = useQueryClient();

  const patchCount = useCallback(
    (
      field: 'likesCount' | 'commentsCount',
      { tvSeriesId, userId, reviewId, delta }: ReviewTvSeriesCountPatch,
    ) => {
      const patchLog = <T extends { review: ReviewTvSeries | null } | null | undefined>(
        old: T,
      ): T => {
        if (!old || !old.review || old.review.id !== reviewId) return old;
        return {
          ...old,
          review: { ...old.review, [field]: Math.max(0, old.review[field] + delta) },
        };
      };

      queryClient.setQueryData(tvSeriesLogOptions({ tvSeriesId, userId }).queryKey, patchLog);
      queryClient.setQueryData(userTvSeriesLogOptions({ userId, tvSeriesId }).queryKey, patchLog);

      updateListItemInAllCaches<
        ReviewTvSeriesWithAuthor,
        ListPaginatedReviewsTvSeries,
        ListInfiniteReviewsTvSeries
      >(
        queryClient,
        {
          paginated: tvSeriesKeys.reviews({ tvSeriesId, mode: 'paginated' }),
          infinite: tvSeriesKeys.reviews({ tvSeriesId, mode: 'infinite' }),
        },
        (item) =>
          ({ [field]: Math.max(0, item[field] + delta) }) as Partial<ReviewTvSeriesWithAuthor>,
        reviewId,
      );

      updateListItemInAllCaches<FeedItem, ListPaginatedFeed, ListInfiniteFeed>(
        queryClient,
        {
          paginated: meFeedPaginatedOptions({ userId }).queryKey,
          infinite: meFeedInfiniteOptions({ userId }).queryKey,
        },
        (item) => {
          if (item.activityType === 'log_tv_series' && item.content.review?.id === reviewId) {
            return {
              content: {
                ...item.content,
                review: {
                  ...item.content.review,
                  [field]: Math.max(0, item.content.review[field] + delta),
                },
              },
            };
          }
          if (item.activityType === 'review_tv_series_like' && item.content.id === reviewId) {
            return {
              content: {
                ...item.content,
                [field]: Math.max(0, item.content[field] + delta),
              },
            };
          }
          return item;
        },
        (item) =>
          (item.activityType === 'log_tv_series' && item.content.review?.id === reviewId) ||
          (item.activityType === 'review_tv_series_like' && item.content.id === reviewId),
      );
    },
    [queryClient],
  );

  const patchLikesCount = useCallback(
    (patch: ReviewTvSeriesCountPatch) => patchCount('likesCount', patch),
    [patchCount],
  );
  const patchCommentsCount = useCallback(
    (patch: ReviewTvSeriesCountPatch) => patchCount('commentsCount', patch),
    [patchCount],
  );

  return { patchLikesCount, patchCommentsCount };
};
