import * as React from 'react';
import { Button } from '@libs/ui/components/button';
import { useAuth } from '@/context/auth-context';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Link } from '@/lib/i18n/navigation';
import { Icons } from '@/config/icons';
import { usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { AlertCircleIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import {
  reviewMovieLikeOptions,
  useReviewMovieLikeMutation,
  useReviewMovieUnlikeMutation,
} from '@libs/query-client';
import { ReviewMovie } from '@libs/api-js';

interface ButtonUserReviewMovieLikeProps
  extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  review: ReviewMovie;
}

const ButtonUserReviewMovieLike = React.forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserReviewMovieLikeProps
>(({ review, className, ...props }, ref) => {
  const { user } = useAuth();
  const t = useTranslations();
  const pathname = usePathname();
  const {
    data: like,
    isLoading,
    isError,
  } = useQuery(
    reviewMovieLikeOptions({
      reviewId: review.id,
      userId: user?.id,
    }),
  );
  const { mutateAsync: insertLike, isPending: isInsertPending } = useReviewMovieLikeMutation({
    userId: user?.id,
    movieId: review.movieId,
    reviewAuthorId: review.userId,
  });
  const { mutateAsync: deleteLike, isPending: isDeletePending } = useReviewMovieUnlikeMutation({
    userId: user?.id,
    movieId: review.movieId,
    reviewAuthorId: review.userId,
  });

  const handleLike = React.useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await insertLike(
        {
          path: {
            review_id: review.id,
          },
        },
        {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [insertLike, review.id, t],
  );

  const handleUnlike = React.useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!like) {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
        return;
      }
      await deleteLike(
        {
          path: {
            review_id: review.id,
          },
        },
        {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [deleteLike, review.id, like, t],
  );

  if (user == null) {
    return (
      <TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
        <Button
          ref={ref}
          size={'icon'}
          variant={'outline'}
          className={cn('rounded-full text-muted-foreground hover:text-accent-pink', className)}
          asChild
          {...props}
        >
          <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
            <Icons.like size={20} />
            {` ${review.likesCount}`}
          </Link>
        </Button>
      </TooltipBox>
    );
  }

  return (
    <TooltipBox
      tooltip={
        like ? upperFirst(t('common.messages.unlike')) : upperFirst(t('common.messages.like'))
      }
    >
      <Button
        ref={ref}
        onClick={like ? handleUnlike : handleLike}
        disabled={isLoading || isError || like === undefined || isInsertPending || isDeletePending}
        size="sm"
        variant={'outline'}
        className={cn(
          'rounded-full',
          like
            ? 'text-accent-pink hover:text-accent-pink/50'
            : 'text-muted-foreground hover:text-accent-pink',
          className,
        )}
        {...props}
      >
        {isLoading || like === undefined ? (
          <Icons.spinner size={20} className="animate-spin" />
        ) : isError ? (
          <AlertCircleIcon size={20} />
        ) : (
          <Icons.like
            size={20}
            className={`
				${like ? 'fill-accent-pink' : 'fill-none'}
				`}
          />
        )}
        {` ${review.likesCount}`}
      </Button>
    </TooltipBox>
  );
});
ButtonUserReviewMovieLike.displayName = 'ButtonUserReviewMovieLike';

export default ButtonUserReviewMovieLike;
