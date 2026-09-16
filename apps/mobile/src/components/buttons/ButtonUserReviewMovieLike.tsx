import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { Button } from '../ui/Button';
import { Text } from '../ui/text';
import { forwardRef } from 'react';
import tw from '../../lib/tw';
import { useUserReviewMovieLike } from '@libs/query-client';
import { useAuth } from '../../providers/AuthProvider';
import { ReviewMovie } from '@libs/api-js';

interface ButtonUserReviewMovieLikeProps
  extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  review: ReviewMovie;
  showCount?: boolean;
}

const ButtonUserReviewMovieLike = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserReviewMovieLikeProps
>(
  (
    {
      review,
      showCount = true,
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
      reviewId: review.id,
      userId: user?.id,
      movieId: review.movieId,
      reviewAuthorId: review.userId,
    });

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
            {review.likesCount}
          </Text>
        )}
      </Button>
    );
  },
);
ButtonUserReviewMovieLike.displayName = 'ButtonUserReviewMovieLike';

export default ButtonUserReviewMovieLike;
