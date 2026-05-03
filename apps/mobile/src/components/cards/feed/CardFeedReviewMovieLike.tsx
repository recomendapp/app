import { useTheme } from '../../../providers/ThemeProvider';
import tw from '../../../lib/tw';
import * as React from 'react';
import Animated from 'react-native-reanimated';
import { ImageWithFallback } from '../../utils/ImageWithFallback';
import { Pressable, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Text } from '../../ui/text';
import { useTranslations } from 'use-intl';
import { Skeleton } from '../../ui/Skeleton';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import { CardReviewMovie } from '../reviews/CardReviewMovie';
import BottomSheetMovie from '../../bottom-sheets/sheets/BottomSheetMovie';
import { CardUser } from '../CardUser';
import { GAP } from '../../../theme/globals';
import { getTmdbImage } from '../../../lib/tmdb/getTmdbImage';
import { FeedItemReviewMovieLike } from '@libs/api-js';
import { FixedOmit } from '../../../utils/fixed-omit';

interface CardFeedReviewMovieLikeBaseProps extends React.ComponentProps<typeof Animated.View> {
  variant?: 'default';
  onPress?: () => void;
  onLongPress?: () => void;
}

type CardFeedReviewMovieLikeSkeletonProps = {
  skeleton: true;
  data?: never;
  footer?: never;
};

type CardFeedReviewMovieLikeDataProps = {
  skeleton?: false;
  data: FeedItemReviewMovieLike;
  footer?: React.ReactNode;
};

export type CardFeedReviewMovieLikeProps = CardFeedReviewMovieLikeBaseProps &
  (CardFeedReviewMovieLikeSkeletonProps | CardFeedReviewMovieLikeDataProps);

const CardFeedReviewMovieLikeDefault = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardFeedReviewMovieLikeProps, 'variant' | 'onPress' | 'onLongPress'>
>(({ style, children, data, footer, skeleton, ...props }, ref) => {
  const { colors } = useTheme();
  const t = useTranslations();
  return (
    <Animated.View ref={ref} style={[{ gap: GAP }, tw`flex-row rounded-xl`, style]} {...props}>
      {!skeleton ? (
        <ImageWithFallback
          source={{
            uri: getTmdbImage({ path: data.content.movie.posterPath, size: 'w342' }) ?? '',
          }}
          alt={data.content.movie.title ?? ''}
          type={'movie'}
          style={tw`w-20 h-full`}
        />
      ) : (
        <Skeleton style={tw`w-20 h-full`} />
      )}
      <View style={tw`flex-1 gap-2 p-2`}>
        {!skeleton ? (
          <View style={tw`flex-row items-center gap-1`}>
            <CardUser user={data.author} variant="icon" />
            <Text style={[{ color: colors.mutedForeground }, tw`text-sm`]} numberOfLines={2}>
              {t.rich('common.messages.user_liked_review', {
                name: () => <Text style={tw`font-semibold`}>{data.author.name}</Text>,
              })}
            </Text>
          </View>
        ) : (
          <Skeleton style={tw`w-full h-6`} />
        )}
        <View style={tw`gap-2`}>
          {!skeleton ? (
            <Text numberOfLines={2} style={tw`font-bold`}>
              {data.content.movie.title}
            </Text>
          ) : (
            <Skeleton style={tw`w-full h-5`} />
          )}
          {footer ||
            (!skeleton ? (
              <CardReviewMovie
                author={data.content.author}
                review={data.content}
                rating={data.content.rating}
                url={{
                  pathname: '/user/[username]/film/[film_id]',
                  params: {
                    username: data.content.author.username,
                    film_id: data.content.movie.id,
                  },
                }}
              />
            ) : (
              <Skeleton style={tw`w-full h-12`} />
            ))}
        </View>
      </View>
    </Animated.View>
  );
});
CardFeedReviewMovieLikeDefault.displayName = 'CardFeedReviewMovieLikeDefault';

const CardFeedReviewMovieLike = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  CardFeedReviewMovieLikeProps
>(({ variant = 'default', onPress, onLongPress, ...props }, ref) => {
  const router = useRouter();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  const handleOnPress = React.useCallback(() => {
    if (!props.data?.content.movie) return;
    router.push({
      pathname: '/film/[film_id]',
      params: { film_id: props.data.content.movie.id },
    });
    onPress?.();
  }, [onPress, props.data?.content.movie, router]);
  const handleOnLongPress = React.useCallback(() => {
    if (!props.data?.content.movie) return;
    openSheet(BottomSheetMovie, {
      movie: props.data.content.movie,
    });
    onLongPress?.();
  }, [onLongPress, openSheet, props.data?.content.movie]);
  const content =
    variant === 'default' ? <CardFeedReviewMovieLikeDefault ref={ref} {...props} /> : null;

  if (props.skeleton) return content;

  return (
    <Pressable onPress={handleOnPress} onLongPress={handleOnLongPress}>
      {content}
    </Pressable>
  );
});
CardFeedReviewMovieLike.displayName = 'CardFeedReviewMovieLike';

export { CardFeedReviewMovieLike, CardFeedReviewMovieLikeDefault };
