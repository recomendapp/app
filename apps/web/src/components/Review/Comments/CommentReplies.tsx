'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Button } from '@libs/ui/components/button';
import { Icons } from '@/config/icons';
import { CommentItem } from './CommentItem';
import {
  reviewMovieCommentRepliesInfiniteOptions,
  reviewTvSeriesCommentRepliesInfiniteOptions,
} from '@libs/query-client';

interface CommentRepliesProps {
  type: 'movie' | 'tv-series';
  reviewId: number;
  reviewAuthorId: string;
  mediaId: number;
  parentId: number;
  onHide?: () => void;
}

export function CommentReplies({
  type,
  reviewId,
  reviewAuthorId,
  mediaId,
  parentId,
  onHide,
}: CommentRepliesProps) {
  const t = useTranslations();

  // Replies aren't auto-loaded on page scroll (a sentinel per reply thread doesn't scale
  // well when several threads are expanded at once) - "load more" is a manual click instead,
  // reusing the exact same infinite query as the auto-scrolled top-level list.
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

  const { data, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage } =
    type === 'movie' ? movieQuery : tvSeriesQuery;

  const replies = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex flex-col gap-3 mt-2 pl-4 border-l-2 border-muted">
      {isLoading ? (
        <Icons.loader size={16} className="text-muted-foreground" />
      ) : (
        replies.map((reply) => (
          <CommentItem
            key={reply.id}
            type={type}
            reviewId={reviewId}
            reviewAuthorId={reviewAuthorId}
            mediaId={mediaId}
            comment={reply}
            isReply
          />
        ))
      )}
      <div className="flex items-center gap-3">
        {hasNextPage && (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="text-xs text-muted-foreground px-0"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Icons.loader size={14} />
            ) : (
              upperFirst(t('common.messages.load_more_replies'))
            )}
          </Button>
        )}
        {onHide && (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="text-xs text-muted-foreground px-0"
            onClick={onHide}
          >
            {upperFirst(t('common.messages.hide_replies'))}
          </Button>
        )}
      </div>
    </div>
  );
}
