import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { Text } from '../ui/text';
import { useAuth } from '../../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import {
  reviewTvSeriesCommentLikeOptions,
  useReviewTvSeriesCommentLikeMutation,
  useReviewTvSeriesCommentUnlikeMutation,
} from '@libs/query-client';
import { useCallback } from 'react';
import { Pressable } from 'react-native';
import tw from '../../lib/tw';

interface ButtonUserReviewTvSeriesCommentLikeProps {
  reviewId: number;
  commentId: number;
  parentId?: number | null;
  likesCount: number;
}

const ButtonUserReviewTvSeriesCommentLike = ({
  reviewId,
  commentId,
  parentId,
  likesCount,
}: ButtonUserReviewTvSeriesCommentLikeProps) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const { data: liked, isLoading } = useQuery(
    reviewTvSeriesCommentLikeOptions({ userId: user?.id, reviewId, commentId }),
  );
  const { mutate: like, isPending: isLikePending } = useReviewTvSeriesCommentLikeMutation({
    userId: user?.id,
    parentId,
  });
  const { mutate: unlike, isPending: isUnlikePending } = useReviewTvSeriesCommentUnlikeMutation({
    userId: user?.id,
    parentId,
  });
  const isPending = isLikePending || isUnlikePending;

  const handleToggle = useCallback(() => {
    if (!user || isPending) return;
    if (liked) {
      unlike({ path: { review_id: reviewId, comment_id: commentId } });
    } else {
      like({ path: { review_id: reviewId, comment_id: commentId } });
    }
  }, [user, isPending, liked, reviewId, commentId, like, unlike]);

  const color = liked ? colors.accentPink : colors.mutedForeground;

  return (
    <Pressable
      onPress={handleToggle}
      disabled={!user || isLoading || liked === undefined || isPending}
      hitSlop={8}
      style={tw`flex-row items-center gap-1 py-1`}
    >
      <Icons.like size={14} color={color} fill={liked ? colors.accentPink : 'transparent'} />
      {likesCount > 0 && <Text style={{ fontSize: 12, color }}>{likesCount}</Text>}
    </Pressable>
  );
};

export default ButtonUserReviewTvSeriesCommentLike;
