'use client';

import * as React from 'react';
import { Textarea } from '@libs/ui/components/textarea';
import { Button } from '@libs/ui/components/button';
import { UserAvatar } from '@/components/User/UserAvatar';
import { useAuth } from '@/context/auth-context';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import toast from 'react-hot-toast';
import { Icons } from '@/config/icons';
import {
  useReviewMovieCommentCreateMutation,
  useReviewTvSeriesCommentCreateMutation,
} from '@libs/query-client';

interface CommentComposerProps {
  type: 'movie' | 'tv-series';
  reviewId: number;
  mediaId: number;
  reviewAuthorId: string;
  parentId?: number;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}

export function CommentComposer({
  type,
  reviewId,
  mediaId,
  reviewAuthorId,
  parentId,
  placeholder,
  autoFocus,
  onDone,
}: CommentComposerProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const pathname = usePathname();
  const [body, setBody] = React.useState('');

  const { mutateAsync: createMovieComment, isPending: isMoviePending } =
    useReviewMovieCommentCreateMutation({ movieId: mediaId, reviewAuthorId });
  const { mutateAsync: createTvSeriesComment, isPending: isTvSeriesPending } =
    useReviewTvSeriesCommentCreateMutation({ tvSeriesId: mediaId, reviewAuthorId });

  const isPending = type === 'movie' ? isMoviePending : isTvSeriesPending;

  const handleSubmit = React.useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      const trimmed = body.trim();
      if (!trimmed || isPending) return;

      try {
        if (type === 'movie') {
          await createMovieComment({
            path: { review_id: reviewId },
            body: { body: trimmed, parentId },
          });
        } else {
          await createTvSeriesComment({
            path: { review_id: reviewId },
            body: { body: trimmed, parentId },
          });
        }
        setBody('');
        onDone?.();
      } catch {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    },
    [
      body,
      isPending,
      type,
      reviewId,
      parentId,
      createMovieComment,
      createTvSeriesComment,
      onDone,
      t,
    ],
  );

  if (!user) {
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
          {upperFirst(t('common.messages.please_login'))}
        </Link>
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 w-full">
      <UserAvatar
        username={user.username}
        avatarUrl={user.avatar}
        className="h-8 w-8 shrink-0 mt-1"
      />
      <div className="flex-1 flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder ?? upperFirst(t('common.messages.write_your_comment_here'))}
          autoFocus={autoFocus}
          rows={1}
          className="min-h-9 py-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" size="icon-sm" disabled={!body.trim() || isPending}>
          {isPending ? <Icons.loader size={16} /> : <Icons.send size={16} />}
        </Button>
      </div>
    </form>
  );
}
