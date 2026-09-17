'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CardUser } from '@/components/Card/CardUser';
import { UserAvatar } from '@/components/User/UserAvatar';
import { Button } from '@libs/ui/components/button';
import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Icons } from '@/config/icons';
import ButtonUserReviewMovieCommentLike from '@/components/buttons/ButtonUserReviewMovieCommentLike';
import ButtonUserReviewTvSeriesCommentLike from '@/components/buttons/ButtonUserReviewTvSeriesCommentLike';
import { CommentComposer } from './CommentComposer';
import { CommentReplies } from './CommentReplies';
import {
  useReviewMovieCommentDeleteMutation,
  useReviewTvSeriesCommentDeleteMutation,
} from '@libs/query-client';
import { ReviewMovieCommentWithAuthor, ReviewTvSeriesCommentWithAuthor } from '@libs/api-js';

export type ReviewComment = ReviewMovieCommentWithAuthor | ReviewTvSeriesCommentWithAuthor;

interface CommentItemProps {
  type: 'movie' | 'tv-series';
  reviewId: number;
  reviewAuthorId: string;
  mediaId: number;
  comment: ReviewComment;
  isReply?: boolean;
  sentinelRef?: React.Ref<HTMLDivElement>;
}

export function CommentItem({
  type,
  reviewId,
  reviewAuthorId,
  mediaId,
  comment,
  isReply,
  sentinelRef,
}: CommentItemProps) {
  const t = useTranslations();
  const format = useFormatter();
  const { user } = useAuth();
  const pathname = usePathname();
  const { createConfirmModal } = useModal();
  const [isReplying, setIsReplying] = React.useState(false);
  const [showReplies, setShowReplies] = React.useState(false);

  const { mutateAsync: deleteMovieComment } = useReviewMovieCommentDeleteMutation({
    movieId: mediaId,
    reviewAuthorId,
  });
  const { mutateAsync: deleteTvSeriesComment } = useReviewTvSeriesCommentDeleteMutation({
    tvSeriesId: mediaId,
    reviewAuthorId,
  });

  const isDeleted = comment.deletedAt !== null;
  const canDelete =
    !!user && !isDeleted && (user.id === comment.userId || user.id === reviewAuthorId);

  const handleDelete = React.useCallback(async () => {
    try {
      if (type === 'movie') {
        await deleteMovieComment({
          path: { review_id: reviewId, comment_id: comment.id },
        });
      } else {
        await deleteTvSeriesComment({
          path: { review_id: reviewId, comment_id: comment.id },
        });
      }
      toast.success(t('common.messages.deleted'));
    } catch {
      toast.error(t('common.messages.an_error_occurred'));
    }
  }, [type, reviewId, comment.id, deleteMovieComment, deleteTvSeriesComment, t]);

  return (
    <div ref={sentinelRef} className="flex items-start gap-2 w-full">
      <UserAvatar
        username={comment.author.username}
        avatarUrl={comment.author.avatar}
        className="h-8 w-8 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <CardUser variant="username" user={comment.author} />
          <span className="text-xs text-muted-foreground">
            {format.relativeTime(new Date(comment.createdAt), new Date())}
          </span>
        </div>

        <p
          className={cn(
            'mt-0.5 text-sm wrap-break-word',
            isDeleted && 'italic text-muted-foreground',
          )}
        >
          {isDeleted ? t('common.messages.comment_deleted') : comment.body}
        </p>

        {!isDeleted && (
          <div className="flex items-center gap-1 mt-1">
            {type === 'movie' ? (
              <ButtonUserReviewMovieCommentLike
                reviewId={reviewId}
                commentId={comment.id}
                parentId={comment.parentId}
                likesCount={comment.likesCount}
              />
            ) : (
              <ButtonUserReviewTvSeriesCommentLike
                reviewId={reviewId}
                commentId={comment.id}
                parentId={comment.parentId}
                likesCount={comment.likesCount}
              />
            )}
            {!isReply &&
              (user ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-xs text-muted-foreground"
                  onClick={() => setIsReplying((v) => !v)}
                >
                  {t('common.messages.reply')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-xs text-muted-foreground"
                  asChild
                >
                  <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
                    {t('common.messages.reply')}
                  </Link>
                </Button>
              ))}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  createConfirmModal({
                    title: t('common.messages.delete_comment'),
                    description: t('common.messages.do_you_really_want_to_delete_this_comment'),
                    onConfirm: () => handleDelete(),
                  })
                }
              >
                <Icons.trash size={14} />
              </Button>
            )}
          </div>
        )}

        {isReplying && (
          <div className="mt-2">
            <CommentComposer
              type={type}
              reviewId={reviewId}
              mediaId={mediaId}
              reviewAuthorId={reviewAuthorId}
              parentId={comment.id}
              placeholder={t('common.messages.reply')}
              autoFocus
              onDone={() => {
                setIsReplying(false);
                setShowReplies(true);
              }}
            />
          </div>
        )}

        {!isReply && comment.repliesCount > 0 && (
          <div className="mt-2">
            {!showReplies ? (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="text-xs text-muted-foreground px-0"
                onClick={() => setShowReplies(true)}
              >
                {t('common.messages.view_replies', { count: comment.repliesCount })}
              </Button>
            ) : (
              <CommentReplies
                type={type}
                reviewId={reviewId}
                reviewAuthorId={reviewAuthorId}
                mediaId={mediaId}
                parentId={comment.id}
                onHide={() => setShowReplies(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
