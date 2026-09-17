import { Alert, Pressable } from 'react-native';
import { useTranslations, useFormatter } from 'use-intl';
import { upperFirst } from 'lodash';
import { View } from '../../../ui/view';
import { Text } from '../../../ui/text';
import { Icon } from '../../../ui/icon';
import UserAvatar from '../../../user/UserAvatar';
import { useAuth } from '../../../../providers/AuthProvider';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useToast } from '../../../Toast';
import { parseApiDate } from '../../../../utils/parseApiDate';
import { Icons } from '../../../../constants/Icons';
import tw from '../../../../lib/tw';
import ButtonUserReviewMovieCommentLike from '../../../buttons/ButtonUserReviewMovieCommentLike';
import ButtonUserReviewTvSeriesCommentLike from '../../../buttons/ButtonUserReviewTvSeriesCommentLike';
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
  onReply?: (comment: ReviewComment) => void;
  repliesExpanded?: boolean;
  onToggleReplies?: (comment: ReviewComment) => void;
}

export const CommentItem = ({
  type,
  reviewId,
  reviewAuthorId,
  mediaId,
  comment,
  isReply,
  onReply,
  repliesExpanded,
  onToggleReplies,
}: CommentItemProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const toast = useToast();

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

  const handleDelete = () => {
    Alert.alert(
      upperFirst(t('common.messages.delete_comment')),
      upperFirst(t('common.messages.do_you_really_want_to_delete_this_comment')),
      [
        { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
        {
          text: upperFirst(t('common.messages.delete')),
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'movie') {
                await deleteMovieComment({ path: { review_id: reviewId, comment_id: comment.id } });
              } else {
                await deleteTvSeriesComment({
                  path: { review_id: reviewId, comment_id: comment.id },
                });
              }
              toast.success(upperFirst(t('common.messages.deleted')));
            } catch {
              toast.error(upperFirst(t('common.messages.error')), {
                description: upperFirst(t('common.messages.an_error_occurred')),
              });
            }
          },
        },
      ],
    );
  };

  return (
    <View style={tw`flex-row gap-2 items-start`}>
      <UserAvatar
        full_name={comment.author.name}
        avatar_url={comment.author.avatar}
        style={{ width: 32, height: 32 }}
      />
      <View style={tw`flex-1 gap-0.5`}>
        <View style={tw`flex-row items-center gap-2 flex-wrap`}>
          <Text style={tw`font-bold`}>{comment.author.username}</Text>
          <Text textColor="muted" style={{ fontSize: 12 }}>
            {format.relativeTime(parseApiDate(comment.createdAt), new Date())}
          </Text>
        </View>
        <Text
          style={[tw`text-sm`, isDeleted && { fontStyle: 'italic', color: colors.mutedForeground }]}
        >
          {isDeleted ? upperFirst(t('common.messages.comment_deleted')) : comment.body}
        </Text>

        {!isDeleted && (
          <View style={tw`flex-row items-center gap-3 mt-1`}>
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
            {!isReply && onReply && (
              <Pressable onPress={() => onReply(comment)} hitSlop={8}>
                <Text textColor="muted" style={{ fontSize: 12, fontWeight: '600' }}>
                  {upperFirst(t('common.messages.reply'))}
                </Text>
              </Pressable>
            )}
            {canDelete && (
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Icon name={Icons.Delete} size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}

        {!isReply && comment.repliesCount > 0 && onToggleReplies && (
          <View style={tw`mt-2`}>
            <Pressable onPress={() => onToggleReplies(comment)} hitSlop={8}>
              <Text textColor="muted" style={{ fontSize: 12, fontWeight: '600' }}>
                {repliesExpanded
                  ? upperFirst(t('common.messages.hide_replies'))
                  : upperFirst(t('common.messages.view_replies', { count: comment.repliesCount }))}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};
