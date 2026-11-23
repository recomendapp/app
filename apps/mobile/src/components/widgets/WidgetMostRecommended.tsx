import {
  View,
  ViewProps,
  useWindowDimensions,
  ViewStyle,
  StyleProp,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Skeleton } from '../ui/Skeleton';
import { Carousel } from '../ui/carousel';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import tw from '../../lib/tw';
import { Image } from 'expo-image';
import { getMediaDetails } from '../utils/getMediaDetails';
import { clamp, upperFirst } from 'lodash';
import { LinearGradient } from 'expo-linear-gradient';
import Color from 'color';
import { useTheme } from '../../providers/ThemeProvider';
import { Text } from '../ui/text';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { BadgeMedia } from '../badges/BadgeMedia';
import { useTranslations } from 'use-intl';
import { useRouter } from 'expo-router';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import BottomSheetMovie from '../bottom-sheets/sheets/BottomSheetMovie';
import BottomSheetTvSeries from '../bottom-sheets/sheets/BottomSheetTvSeries';
import { getTmdbImage } from '../../lib/tmdb/getTmdbImage';
import { RecoTrendingWithMovie, RecoTrendingWithTvSeries } from '@libs/api-js';
import { useInfiniteQuery } from '@tanstack/react-query';
import { widgetRecosTrendingInfiniteOptions } from '@libs/query-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WidgetMostRecommendedProps extends ViewProps {
  scrollY?: SharedValue<number>;
}

const WidgetMostRecommended = ({ scrollY, style, ...props }: WidgetMostRecommendedProps) => {
  const { theme } = useTheme();
  const navigationHeaderHeight = useHeaderHeight();
  // Dimensions
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // Queries
  const { data, isLoading, isError } = useInfiniteQuery(widgetRecosTrendingInfiniteOptions());
  const flattenRecos = data?.pages.flatMap((page) => page.data) || [];

  const height = clamp(screenHeight / 2, 200, 400);

  if (data === undefined || isLoading) {
    return <Skeleton style={[{ height: height }, tw`w-full`, style]} />;
  }
  if (!flattenRecos.length || isError)
    return <View style={[{ height: navigationHeaderHeight }, tw`w-full`, style]} />;
  return (
    <View style={{ paddingBottom: theme.spaces.md }} {...props}>
      <Carousel
        data={flattenRecos}
        width={screenWidth}
        height={height}
        renderItem={({ item, index }) => (
          <WidgetMostRecommendedItem
            item={item}
            position={index + 1}
            style={[style]}
            scrollY={scrollY}
            baseHeight={height}
          />
        )}
      />
    </View>
  );
};

const WidgetMostRecommendedItem = ({
  item,
  position,
  style,
  scrollY,
  baseHeight,
}: {
  item:
    | ({
        type: 'movie';
      } & RecoTrendingWithMovie)
    | ({
        type: 'tv_series';
      } & RecoTrendingWithTvSeries);
  position: number;
  style?: StyleProp<ViewStyle>;
  scrollY?: SharedValue<number>;
  baseHeight: number;
}) => {
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  const router = useRouter();
  const { colors, theme } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const navigationHeaderHeight = useHeaderHeight();
  const details =
    item.type === 'movie'
      ? getMediaDetails({ type: 'movie', media: item.media })
      : item.type === 'tv_series'
        ? getMediaDetails({ type: 'tv_series', media: item.media })
        : null;
  const handleOnPress = () => {
    if (!details?.url) return;
    router.push(details.url);
  };
  const handleOnLongPress = () => {
    switch (item.type) {
      case 'movie':
        return openSheet(BottomSheetMovie, { movie: item.media });
      case 'tv_series':
        return openSheet(BottomSheetTvSeries, { tvSeries: item.media });
      default:
        return null;
    }
  };

  const bgAnim = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const stretch = Math.max(-scrollY.value, 0);
    const base = baseHeight;
    const scale = 1 + stretch / base;
    const clampedScale = Math.min(scale, 3);
    const translateY = -stretch / 2;

    return {
      transform: [{ translateY }, { scaleY: clampedScale }, { scaleX: clampedScale }],
    };
  });
  return (
    <Pressable onLongPress={handleOnLongPress}>
      <View style={[{ paddingTop: navigationHeaderHeight }, tw`h-full`, style]}>
        <Animated.View style={[tw`absolute inset-0`, bgAnim]}>
          {item.media.backdropPath && (
            <Image
              style={StyleSheet.absoluteFill}
              source={{ uri: getTmdbImage({ path: item.media.backdropPath, size: 'w1280' }) ?? '' }}
            />
          )}
          <LinearGradient
            colors={[
              'transparent',
              Color.hsl(colors.background).alpha(0.6).string(),
              Color.hsl(colors.background).alpha(0.8).string(),
              Color.hsl(colors.background).string(),
            ]}
            locations={[0, 0.5, 0.75, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View
          style={[
            tw`flex-1 justify-end`,
            {
              gap: theme.spaces.md,
              paddingLeft: insets.left + theme.spaces.horizontal,
              paddingRight: insets.right + theme.spaces.horizontal,
              paddingBottom: theme.spaces.md,
            },
          ]}
        >
          <View style={[{ gap: theme.spaces.md * 2 }, tw`flex-row items-center justify-between`]}>
            <Text style={tw`font-bold`}>
              {upperFirst(t('common.messages.most_recommended', { count: 2 }))}
            </Text>
            <View style={[tw`flex-row items-center shrink-0`, { gap: theme.spaces.md }]}>
              <BadgeMedia type={item.type} />
              <Text style={tw`text-xl font-bold`}># {position}</Text>
            </View>
          </View>
          <View style={[{ gap: theme.spaces.md }]}>
            <Text
              onPress={handleOnPress}
              onLongPress={handleOnLongPress}
              style={tw`text-xl font-bold`}
            >
              {details?.title}
            </Text>
            {!!item.media.overview?.length && (
              <Text style={tw`text-base`} numberOfLines={2}>
                {item.media.overview}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default WidgetMostRecommended;
