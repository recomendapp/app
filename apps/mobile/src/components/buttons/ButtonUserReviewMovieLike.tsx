import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { Button } from '../ui/Button';
import { Text } from '../ui/text';
import { forwardRef } from 'react';
import tw from '../../lib/tw';
import { useUserReviewMovieLike } from '@libs/query-client';
import { useAuth } from '../../providers/AuthProvider';
import { ReviewMovie } from '@libs/api-js';
import { formatCompactCount } from '../../utils/formatCompactCount';
import { AnimatedPressable } from '../ui/AnimatedPressable';

interface ButtonUserReviewMovieLikeProps
  extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  review: ReviewMovie;
  showCount?: boolean;
  compact?: boolean;
}

const ButtonUserReviewMovieLike = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserReviewMovieLikeProps
>(
  (
    {
      review,
      showCount = true,
      compact = false,
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
    const { isLiked, isLoading, isPending, toggle } = useUserReviewMovieLike({
      reviewId: review.id,
      userId: user?.id,
      movieId: review.movieId,
      reviewAuthorId: review.userId,
    });

    const color = isLiked ? colors.accentPink : colors.mutedForeground;

    if (compact) {
      return (
        <AnimatedPressable
          onPress={(event) => {
            toggle();
            onPress?.(event);
          }}
          disabled={!user || isLoading || isLiked === undefined || isPending}
          hitSlop={8}
          style={tw`flex-row items-center gap-1 py-1`}
        >
          <Icons.like size={14} color={color} fill={isLiked ? colors.accentPink : 'transparent'} />
          {review.likesCount > 0 && (
            <Text style={{ fontSize: 12, color }}>{formatCompactCount(review.likesCount)}</Text>
          )}
        </AnimatedPressable>
      );
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size || (showCount ? undefined : 'icon')}
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
        {showCount && (
          <Text style={[{ color: isLiked ? colors.accentPink : colors.foreground }]}>
            {formatCompactCount(review.likesCount)}
          </Text>
        )}
      </Button>
    );
  },
);
ButtonUserReviewMovieLike.displayName = 'ButtonUserReviewMovieLike';

export default ButtonUserReviewMovieLike;
