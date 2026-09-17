import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  reviewMovieCommentRepliesInfiniteOptions,
  reviewTvSeriesCommentRepliesInfiniteOptions,
} from '@libs/query-client';
import { ReviewComment } from './CommentItem';

export interface RepliesState {
  replies: ReviewComment[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
}

interface CommentRepliesLoaderProps {
  type: 'movie' | 'tv-series';
  reviewId: number;
  parentId: number;
  onChange: (parentId: number, state: RepliesState) => void;
}

/**
 * Renders nothing - just keeps a replies infinite query alive for one
 * expanded comment and reports its state up to the screen, which flattens
 * it into the single LegendList data array (see ReviewMovieCommentsScreen).
 * One of these gets mounted per currently-expanded top-level comment.
 */
export const CommentRepliesLoader = ({
  type,
  reviewId,
  parentId,
  onChange,
}: CommentRepliesLoaderProps) => {
  const movieQuery = useInfiniteQuery(
    reviewMovieCommentRepliesInfiniteOptions({
      reviewId: type === 'movie' ? reviewId : undefined,
      commentId: type === 'movie' ? parentId : undefined,
      filters: { sort_order: 'asc' },
    }),
  );
  const tvSeriesQuery = useInfiniteQuery(
    reviewTvSeriesCommentRepliesInfiniteOptions({
      reviewId: type === 'tv-series' ? reviewId : undefined,
      commentId: type === 'tv-series' ? parentId : undefined,
      filters: { sort_order: 'asc' },
    }),
  );

  const query = type === 'movie' ? movieQuery : tvSeriesQuery;
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = query;

  const replies = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  useEffect(() => {
    onChange(parentId, {
      replies,
      hasNextPage: !!hasNextPage,
      isFetchingNextPage,
      isLoading,
      fetchNextPage,
    });
  }, [onChange, parentId, replies, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  return null;
};
