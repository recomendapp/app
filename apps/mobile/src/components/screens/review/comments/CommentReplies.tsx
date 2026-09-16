import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { Pressable } from 'react-native';
import { View } from '../../../ui/view';
import { Text } from '../../../ui/text';
import { Icons } from '../../../../constants/Icons';
import { useTheme } from '../../../../providers/ThemeProvider';
import tw from '../../../../lib/tw';
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
}

export const CommentReplies = ({
  type,
  reviewId,
  reviewAuthorId,
  mediaId,
  parentId,
}: CommentRepliesProps) => {
  const t = useTranslations();
  const { colors } = useTheme();

  // Replies aren't auto-loaded on scroll (they live inside a comment item, not the
  // outer list) - "load more" is a manual tap, reusing the same infinite query as
  // the top-level comment list.
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
    <View style={[tw`gap-3 mt-2 pl-3 border-l-2`, { borderColor: colors.border }]}>
      {isLoading ? (
        <Icons.Loader />
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
      {hasNextPage &&
        (isFetchingNextPage ? (
          <Icons.Loader />
        ) : (
          <Pressable onPress={() => fetchNextPage()} hitSlop={8}>
            <Text textColor="muted" style={{ fontSize: 12, fontWeight: '600' }}>
              {upperFirst(t('common.messages.load_more_replies'))}
            </Text>
          </Pressable>
        ))}
    </View>
  );
};
