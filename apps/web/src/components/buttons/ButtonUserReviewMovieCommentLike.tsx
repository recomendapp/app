'use client';

import * as React from 'react';
import { Button } from '@libs/ui/components/button';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Icons } from '@/config/icons';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import {
  reviewMovieCommentLikeOptions,
  useReviewMovieCommentLikeMutation,
  useReviewMovieCommentUnlikeMutation,
} from '@libs/query-client';

interface ButtonUserReviewMovieCommentLikeProps {
  reviewId: number;
  commentId: number;
  parentId?: number | null;
  likesCount: number;
  className?: string;
}

export default function ButtonUserReviewMovieCommentLike({
  reviewId,
  commentId,
  parentId,
  likesCount,
  className,
}: ButtonUserReviewMovieCommentLikeProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const pathname = usePathname();

  const { data: liked, isLoading } = useQuery(
    reviewMovieCommentLikeOptions({ userId: user?.id, reviewId, commentId }),
  );

  const { mutateAsync: like, isPending: isLikePending } = useReviewMovieCommentLikeMutation({
    userId: user?.id,
    parentId,
  });
  const { mutateAsync: unlike, isPending: isUnlikePending } = useReviewMovieCommentUnlikeMutation({
    userId: user?.id,
    parentId,
  });
  const isPending = isLikePending || isUnlikePending;

  const handleToggle = React.useCallback(async () => {
    if (!user || isPending) return;
    try {
      if (liked) {
        await unlike({ path: { review_id: reviewId, comment_id: commentId } });
      } else {
        await like({ path: { review_id: reviewId, comment_id: commentId } });
      }
    } catch {
      toast.error(upperFirst(t('common.messages.an_error_occurred')));
    }
  }, [user, isPending, liked, reviewId, commentId, like, unlike, t]);

  if (!user) {
    return (
      <TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          asChild
          className={cn(
            'text-xs gap-1 px-1.5 text-muted-foreground hover:text-accent-pink',
            className,
          )}
        >
          <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
            <Icons.like size={14} />
            {likesCount > 0 ? likesCount : null}
          </Link>
        </Button>
      </TooltipBox>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={handleToggle}
      disabled={isLoading || liked === undefined || isPending}
      className={cn(
        'text-xs gap-1 px-1.5',
        liked
          ? 'text-accent-pink hover:text-accent-pink/70'
          : 'text-muted-foreground hover:text-accent-pink',
        className,
      )}
    >
      <Icons.like size={14} className={liked ? 'fill-accent-pink' : 'fill-none'} />
      {likesCount > 0 ? likesCount : null}
    </Button>
  );
}
