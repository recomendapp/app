import { useTheme } from '../../../providers/ThemeProvider';
import tw from '../../../lib/tw';
import * as React from 'react';
import Animated from 'react-native-reanimated';
import { ImageWithFallback } from '../../utils/ImageWithFallback';
import { Pressable, View } from 'react-native';
import FeedUserLog from '../../screens/feed/FeedUserLog';
import { useRouter } from 'expo-router';
import { Text } from '../../ui/text';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Skeleton } from '../../ui/Skeleton';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import BottomSheetTvSeries from '../../bottom-sheets/sheets/BottomSheetTvSeries';
import { CardUser } from '../CardUser';
import { CardReviewTvSeries } from '../reviews/CardReviewTvSeries';
import { GAP } from '../../../theme/globals';
import { getTmdbImage } from '../../../lib/tmdb/getTmdbImage';
import { FeedItemLogTvSeries } from '@libs/api-js';
import { FixedOmit } from '../../../utils/fixed-omit';

interface CardFeedLogTvSeriesBaseProps extends React.ComponentProps<typeof Animated.View> {
  variant?: 'default';
  onPress?: () => void;
  onLongPress?: () => void;
}

type CardFeedLogTvSeriesSkeletonProps = {
  skeleton: true;
  data?: never;
  footer?: never;
};

type CardFeedLogTvSeriesDataProps = {
  skeleton?: false;
  data: FeedItemLogTvSeries;
  footer?: React.ReactNode;
};

export type CardFeedLogTvSeriesProps = CardFeedLogTvSeriesBaseProps &
  (CardFeedLogTvSeriesSkeletonProps | CardFeedLogTvSeriesDataProps);

const CardFeedLogTvSeriesDefault = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  FixedOmit<CardFeedLogTvSeriesProps, 'variant' | 'onPress' | 'onLongPress'>
>(({ style, children, data, footer, skeleton, ...props }, ref) => {
  const { colors } = useTheme();
  const t = useTranslations();
  return (
    <Animated.View ref={ref} style={[{ gap: GAP }, tw`flex-row rounded-xl`, style]} {...props}>
      {!skeleton ? (
        <ImageWithFallback
          source={{
            uri: getTmdbImage({ path: data.content.tvSeries.posterPath, size: 'w342' }) ?? '',
          }}
          alt={data.content.tvSeries.name ?? ''}
          type={'tv_series'}
          style={tw`w-20 h-full`}
        />
      ) : (
        <Skeleton style={tw`w-20 h-full`} />
      )}
      <View style={tw`flex-1 gap-2 p-2`}>
        {!skeleton ? (
          <View style={tw`flex-row items-center gap-1`}>
            <CardUser user={data.author} variant="icon" />
            <FeedUserLog
              author={data.author}
              log={data.content}
              style={[{ color: colors.mutedForeground }, tw`text-sm`]}
            />
          </View>
        ) : (
          <Skeleton style={tw`w-full h-6`} />
        )}
        <View style={tw`gap-2`}>
          {!skeleton ? (
            <Text numberOfLines={2} style={tw`font-bold`}>
              {data.content.tvSeries.name}
            </Text>
          ) : (
            <Skeleton style={tw`w-full h-5`} />
          )}
          {footer ||
            (skeleton ? (
              <Skeleton style={tw`w-full h-12`} />
            ) : data.content.review ? (
              <CardReviewTvSeries
                author={data.author}
                review={data.content.review}
                rating={data.content.rating}
                url={{
                  pathname: '/user/[username]/tv-series/[tv_series_id]',
                  params: {
                    username: data.author.username,
                    tv_series_id: data.content.tvSeries.id,
                  },
                }}
              />
            ) : (
              <Text
                textColor={!data.content.tvSeries.overview ? 'muted' : undefined}
                numberOfLines={2}
                style={tw`text-xs text-justify`}
              >
                {data.content.tvSeries.overview || upperFirst(t('common.messages.no_description'))}
              </Text>
            ))}
        </View>
      </View>
    </Animated.View>
  );
});
CardFeedLogTvSeriesDefault.displayName = 'CardFeedLogTvSeriesDefault';

const CardFeedLogTvSeries = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  CardFeedLogTvSeriesProps
>(({ variant = 'default', onPress, onLongPress, ...props }, ref) => {
  const router = useRouter();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  const handleOnPress = React.useCallback(() => {
    if (!props.data?.content.tvSeries) return;
    router.push({
      pathname: '/tv-series/[tv_series_id]',
      params: {
        tv_series_id: props.data.content.tvSeries.id,
      },
    });
    onPress?.();
  }, [onPress, props.data?.content.tvSeries, router]);
  const handleOnLongPress = React.useCallback(() => {
    if (!props.data?.content.tvSeries) return;
    openSheet(BottomSheetTvSeries, {
      tvSeries: props.data.content.tvSeries,
    });
    onLongPress?.();
  }, [onLongPress, openSheet, props.data?.content.tvSeries]);
  const content =
    variant === 'default' ? <CardFeedLogTvSeriesDefault ref={ref} {...props} /> : null;

  if (props.skeleton) return content;

  return (
    <Pressable onPress={handleOnPress} onLongPress={handleOnLongPress}>
      {content}
    </Pressable>
  );
});
CardFeedLogTvSeries.displayName = 'CardFeedLogTvSeries';

export { CardFeedLogTvSeries, CardFeedLogTvSeriesDefault };
