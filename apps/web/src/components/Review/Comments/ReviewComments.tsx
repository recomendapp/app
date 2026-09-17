'use client';

import * as React from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Skeleton } from '@libs/ui/components/skeleton';
import { Icons } from '@/config/icons';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';
import {
  reviewMovieCommentsInfiniteOptions,
  reviewTvSeriesCommentsInfiniteOptions,
} from '@libs/query-client';

interface ReviewCommentsProps {
  type: 'movie' | 'tv-series';
  reviewId: number;
  reviewAuthorId: string;
  mediaId: number;
  commentsCount: number;
}

export function ReviewComments({
  type,
  reviewId,
  reviewAuthorId,
  mediaId,
  commentsCount,
}: ReviewCommentsProps) {
  const t = useTranslations();
  const { ref, inView } = useInView();

  // Top-level comments auto-load on scroll (single flat list, one sentinel) - the same
  // pattern used for the review list itself in MovieReviews.tsx.
  const movieQuery = useInfiniteQuery(
    reviewMovieCommentsInfiniteOptions({
      reviewId: type === 'movie' ? reviewId : undefined,
    }),
  );
  const tvSeriesQuery = useInfiniteQuery(
    reviewTvSeriesCommentsInfiniteOptions({
      reviewId: type === 'tv-series' ? reviewId : undefined,
    }),
  );

  const { data, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage } =
    type === 'movie' ? movieQuery : tvSeriesQuery;

  React.useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const pages = data?.pages ?? [];

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="font-bold text-lg">
        {upperFirst(t('common.messages.comment_count', { count: commentsCount }))}
      </h2>

      <CommentComposer
        type={type}
        reviewId={reviewId}
        mediaId={mediaId}
        reviewAuthorId={reviewAuthorId}
      />

      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-12 w-full rounded-md"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))
        ) : pages[0]?.data.length ? (
          pages.map((page, i) =>
            page.data.map((comment, index) => (
              <CommentItem
                key={comment.id}
                type={type}
                reviewId={reviewId}
                reviewAuthorId={reviewAuthorId}
                mediaId={mediaId}
                comment={comment}
                sentinelRef={
                  i === pages.length - 1 && index === page.data.length - 1 ? ref : undefined
                }
              />
            )),
          )
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            {upperFirst(t('common.messages.no_comment'))}
          </p>
        )}
        {isFetchingNextPage && <Icons.loader className="mx-auto text-muted-foreground" />}
      </div>
    </div>
  );
}
