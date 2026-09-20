import * as React from 'react';
import Animated from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { useRouter, Href } from 'expo-router';
import tw from '../../../lib/tw';
import { useTheme } from '../../../providers/ThemeProvider';
import { IconMediaRating } from '../../medias/IconMediaRating';
import { CardUser } from '../CardUser';
import { Text } from '../../ui/text';
import { Skeleton } from '../../ui/Skeleton';
import ButtonUserReviewTvSeriesLike from '../../buttons/ButtonUserReviewTvSeriesLike';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import { BottomSheetReviewTvSeries } from '../../bottom-sheets/sheets/BottomSheetReviewTvSeries';
import { convert } from 'html-to-text';
import { ReviewTvSeries, UserSummary } from '@libs/api-js';
import { FixedOmit } from '../../../utils/fixed-omit';
import UserAvatar from '../../user/UserAvatar';
import { Icons } from '../../../constants/Icons';
import { formatCompactCount } from '../../../utils/formatCompactCount';

interface CardReviewTvSeriesBaseProps extends React.ComponentPropsWithRef<typeof Animated.View> {
  variant?: 'default';
  onPress?: () => void;
  onLongPress?: () => void;
  linked?: boolean;
  onCommentPress?: () => void;
}

type CardReviewTvSeriesSkeletonProps = {
  skeleton: true;
  review?: never;
  author?: never;
  rating?: never;
  url?: never;
};

type CardReviewTvSeriesDataProps = {
  skeleton?: false;
  review: ReviewTvSeries;
  author: UserSummary;
  rating?: number | null;
  url: Href;
};

export type CardReviewTvSeriesProps = CardReviewTvSeriesBaseProps &
  (CardReviewTvSeriesSkeletonProps | CardReviewTvSeriesDataProps);

const CardReviewTvSeriesDefault = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardReviewTvSeriesProps, 'variant' | 'linked' | 'onPress' | 'onLongPress' | 'url'>
>(({ review, rating, skeleton, author, onCommentPress, style, ...props }, ref) => {
  const { colors } = useTheme();
  return (
    <Animated.View ref={ref} style={[tw.style('flex-col w-full'), style]} {...props}>
      <View style={tw.style('flex-row gap-2')}>
        <View style={tw.style('items-center self-stretch gap-1')}>
          {!skeleton ? (
            <UserAvatar
              full_name={author.name}
              avatar_url={author.avatar}
              style={{ width: 32, height: 32 }}
            />
          ) : (
            <UserAvatar skeleton style={{ width: 32, height: 32 }} />
          )}
          <View style={[tw.style('w-px flex-1'), { backgroundColor: colors.muted }]} />
        </View>
        <View style={tw.style('flex-1 gap-1')}>
          <View style={tw.style('flex-row h-8 items-center justify-between gap-2')}>
            {!skeleton ? (
              <CardUser variant="username" user={author} />
            ) : (
              <Skeleton style={tw.style('h-4 w-20')} />
            )}
            {rating !== undefined && <IconMediaRating rating={rating} skeleton={skeleton} />}
          </View>
          {review?.title &&
            (!skeleton ? (
              <Text numberOfLines={1} style={tw.style('font-semibold')}>
                {review?.title}
              </Text>
            ) : (
              <Skeleton style={tw.style('h-4 w-1/3')} />
            ))}
          {!skeleton ? (
            <Text numberOfLines={3} style={tw.style('text-sm text-justify')}>
              {convert(review.body, {
                selectors: [{ selector: 'a', options: { ignoreHref: true } }],
              })}
            </Text>
          ) : (
            <Skeleton style={tw.style('h-12 w-full')} />
          )}
        </View>
      </View>
      {!skeleton && (
        <View style={tw.style('flex-row items-center gap-3 mt-2')}>
          <ButtonUserReviewTvSeriesLike review={review} compact />
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onCommentPress?.();
            }}
            hitSlop={8}
            style={tw.style('flex-row items-center gap-1 py-1')}
          >
            <Icons.Comment size={14} color={colors.mutedForeground} />
            {review.commentsCount > 0 && (
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                {formatCompactCount(review.commentsCount)}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
});
CardReviewTvSeriesDefault.displayName = 'CardReviewTvSeriesDefault';

const CardReviewTvSeries = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  CardReviewTvSeriesProps
>(
  (
    { linked = true, variant = 'default', url, onPress, onLongPress, onCommentPress, ...props },
    ref,
  ) => {
    const router = useRouter();
    const openSheet = useBottomSheetStore((state) => state.openSheet);
    const handlePress = () => {
      if (linked) router.push(url as Href);
      onPress?.();
    };
    const handleCommentPress = () => {
      if (props.skeleton) return;
      router.push({
        pathname: '/user/[username]/tv-series/[tv_series_id]/comments',
        params: {
          username: props.author.username,
          tv_series_id: props.review.tvSeriesId,
        },
      });
    };

    const content =
      variant === 'default' ? (
        <CardReviewTvSeriesDefault
          ref={ref}
          onCommentPress={onCommentPress ?? handleCommentPress}
          {...props}
        />
      ) : null;

    if (props.skeleton) return content;

    return (
      <Pressable
        onPress={handlePress}
        onLongPress={() => {
          openSheet(BottomSheetReviewTvSeries, {
            review: props.review,
            author: props.author,
          });
          onLongPress?.();
        }}
      >
        {content}
      </Pressable>
    );
  },
);
CardReviewTvSeries.displayName = 'CardReviewTvSeries';

export { CardReviewTvSeries, CardReviewTvSeriesDefault };
