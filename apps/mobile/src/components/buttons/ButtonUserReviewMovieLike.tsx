import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { Button } from '../ui/Button';
import { Text } from '../ui/text';
import { forwardRef, useEffect, useState } from 'react';
import tw from '../../lib/tw';
import { useUserReviewMovieLike } from '@libs/query-client';
import { useAuth } from '../../providers/AuthProvider';

interface ButtonUserReviewMovieLikeProps extends React.ComponentProps<typeof Button> {
  reviewId: number;
  reviewLikesCount?: number;
}

const ButtonUserReviewMovieLike = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserReviewMovieLikeProps
>(
  (
    {
      reviewId,
      reviewLikesCount,
      variant = 'outline',
      size,
      icon = Icons.like,
      style,
      onPress,
      ...props
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { isLiked, toggle } = useUserReviewMovieLike({
      reviewId,
      userId: user?.id,
    });
    const [likeCount, setLikeCount] = useState<number | undefined>(reviewLikesCount);

    useEffect(() => {
      setLikeCount(reviewLikesCount);
    }, [reviewLikesCount]);

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size || reviewLikesCount === undefined ? 'icon' : undefined}
        icon={icon}
        iconProps={{
          color: isLiked ? colors.accentPink : colors.foreground,
          fill: isLiked ? colors.accentPink : 'transparent',
        }}
        onPress={(e) => {
          toggle();
          onPress?.(e);
        }}
        style={{
          ...tw`rounded-full`,
          ...style,
        }}
        {...props}
      >
        {reviewLikesCount !== undefined && (
          <Text style={[{ color: isLiked ? colors.accentPink : colors.foreground }]}>
            {likeCount}
          </Text>
        )}
      </Button>
    );
  },
);
ButtonUserReviewMovieLike.displayName = 'ButtonUserReviewMovieLike';

export default ButtonUserReviewMovieLike;
