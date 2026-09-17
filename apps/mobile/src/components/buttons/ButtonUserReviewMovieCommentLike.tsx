import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { Text } from '../ui/text';
import { useAuth } from '../../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import {
  reviewMovieCommentLikeOptions,
  useReviewMovieCommentLikeMutation,
  useReviewMovieCommentUnlikeMutation,
} from '@libs/query-client';
import { useCallback } from 'react';
import { Pressable } from 'react-native';
import tw from '../../lib/tw';

interface ButtonUserReviewMovieCommentLikeProps {
  reviewId: number;
  commentId: number;
  parentId?: number | null;
  likesCount: number;
}

const ButtonUserReviewMovieCommentLike = ({
  reviewId,
  commentId,
  parentId,
  likesCount,
}: ButtonUserReviewMovieCommentLikeProps) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const { data: liked, isLoading } = useQuery(
    reviewMovieCommentLikeOptions({ userId: user?.id, reviewId, commentId }),
  );
  const { mutate: like, isPending: isLikePending } = useReviewMovieCommentLikeMutation({
    userId: user?.id,
    parentId,
  });
  const { mutate: unlike, isPending: isUnlikePending } = useReviewMovieCommentUnlikeMutation({
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

export default ButtonUserReviewMovieCommentLike;
