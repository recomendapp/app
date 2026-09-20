import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { Button } from '../ui/Button';
import { Text } from '../ui/text';
import { forwardRef } from 'react';
import tw from '../../lib/tw';
import { useUserReviewTvSeriesLike } from '@libs/query-client';
import { useAuth } from '../../providers/AuthProvider';
import { ReviewTvSeries } from '@libs/api-js';
import { Pressable } from 'react-native';
import { formatCompactCount } from '../../utils/formatCompactCount';

interface ButtonUserReviewTvSeriesLikeProps
  extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  review: ReviewTvSeries;
  showCount?: boolean;
  compact?: boolean;
}

const ButtonUserReviewTvSeriesLike = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserReviewTvSeriesLikeProps
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
    const { isLiked, isLoading, isPending, toggle } = useUserReviewTvSeriesLike({
      reviewId: review.id,
      userId: user?.id,
      tvSeriesId: review.tvSeriesId,
      reviewAuthorId: review.userId,
    });

    const color = isLiked ? colors.accentPink : colors.mutedForeground;

    if (compact) {
      return (
        <Pressable
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
        </Pressable>
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
ButtonUserReviewTvSeriesLike.displayName = 'ButtonUserReviewTvSeriesLike';

export default ButtonUserReviewTvSeriesLike;
