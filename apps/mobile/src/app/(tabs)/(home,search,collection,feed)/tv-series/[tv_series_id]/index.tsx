import { Link, useLocalSearchParams } from 'expo-router';
import { lowerCase, upperFirst } from 'lodash';
import { ScrollView, Pressable, useWindowDimensions, View, ViewProps } from 'react-native';
import tw from '../../../../../lib/tw';
import { useTheme } from '../../../../../providers/ThemeProvider';
import {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getIdFromSlug } from '../../../../../utils/getIdFromSlug';
import { useCallback, useMemo, useState } from 'react';
import TvSeriesWidgetSeasons from '../../../../../components/screens/tv-series/TvSeriesWidgetSeasons';
import { useTranslations } from 'use-intl';
import { Text, TextProps } from '../../../../../components/ui/text';
import AnimatedStackScreen from '../../../../../components/ui/AnimatedStackScreen';
import { useTvSeriesHeaderMenu } from '../../../../../components/header-menus/useTvSeriesHeaderMenu';
import TvSeriesHeader from '../../../../../components/screens/tv-series/TvSeriesHeader';
import TvSeriesWidgetPlaylists from '../../../../../components/screens/tv-series/TvSeriesWidgetPlaylists';
import TvSeriesWidgetReviews from '../../../../../components/screens/tv-series/TvSeriesWidgetReviews';
import { Button } from '../../../../../components/ui/Button';
import { useAuth } from '../../../../../providers/AuthProvider';
import { FloatingBar } from '../../../../../components/ui/FloatingBar';
import AnimatedContentContainer from '../../../../../components/ui/AnimatedContentContainer';
import { Icons } from '../../../../../constants/Icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { LegendList } from '@legendapp/list/react-native';
import { Vimeo } from 'react-native-vimeo-iframe';
import TvSeriesWidgetCast from '../../../../../components/screens/tv-series/TvSeriesWidgetCast';
import { useQuery } from '@tanstack/react-query';
import { tvSeriesCastingOptions, tvSeriesOptions } from '@libs/query-client';
import { TvSeries, TvSeriesTrailer } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ButtonUserBookmark } from '../../../../../components/buttons/ButtonUserBookmark';
import { ButtonPlaylistAdd } from '../../../../../components/buttons/ButtonPlaylistAdd';
import ButtonUserRecoSend from '../../../../../components/buttons/ButtonUserRecoSend';
import ButtonUserLogTvSeries from '../../../../../components/buttons/tv-series/ButtonUserLogTvSeries';

const TvSeriesScreen = () => {
  const { theme } = useTheme();
  const { tv_series_id } = useLocalSearchParams<{ tv_series_id: string }>();
  const { id: seriesId } = getIdFromSlug(tv_series_id);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const { data: series, isLoading } = useQuery(
    tvSeriesOptions({
      tvSeriesId: seriesId,
    }),
  );
  // Prefetch
  useQuery(tvSeriesCastingOptions({ tvSeriesId: seriesId }));

  const loading = series === undefined || isLoading;

  // SharedValue
  const headerHeight = useSharedValue<number>(0);
  const scrollY = useSharedValue<number>(0);
  const floatingBarHeight = useSharedValue<number>(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

  const animatedContentContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: withTiming(insets.bottom + theme.spaces.md * 2 + floatingBarHeight.value, {
        duration: 300,
      }),
    };
  });

  const { onMenuPress, headerRightItems } = useTvSeriesHeaderMenu({ tvSeries: series });

  return (
    <>
      <AnimatedStackScreen
        options={{
          headerTitle: series?.name || '',
          headerTransparent: true,
          unstable_headerRightItems: headerRightItems,
        }}
        scrollY={scrollY}
        triggerHeight={headerHeight}
        onMenuPress={series ? onMenuPress : undefined}
      />
      <AnimatedContentContainer
        onScroll={scrollHandler}
        scrollToOverflowEnabled
        contentContainerStyle={animatedContentContainerStyle}
      >
        <TvSeriesHeader
          tvSeries={series}
          loading={loading}
          scrollY={scrollY}
          triggerHeight={headerHeight}
        />
        {series && (
          <View style={tw`flex-col gap-4`}>
            {/* DETAILS */}
            <View style={{ gap: theme.spaces.md }}>
              <View style={{ gap: theme.spaces.sm }}>
                <TvSeriesSynopsis
                  tvSeries={series}
                  containerStyle={{
                    paddingLeft: insets.left + theme.spaces.horizontal,
                    paddingRight: insets.right + theme.spaces.horizontal,
                  }}
                />
                <TvSeriesOriginalTitle
                  tvSeries={series}
                  style={{
                    marginLeft: insets.left + theme.spaces.horizontal,
                    marginRight: insets.right + theme.spaces.horizontal,
                  }}
                />
              </View>
              <TvSeriesWidgetCast tvSeriesId={series.id} />
              <TvSeriesWidgetSeasons
                tvSeries={series}
                containerStyle={{
                  paddingLeft: insets.left + theme.spaces.horizontal,
                  paddingRight: insets.right + theme.spaces.horizontal,
                }}
                labelStyle={{
                  paddingLeft: insets.left + theme.spaces.horizontal,
                  paddingRight: insets.right + theme.spaces.horizontal,
                }}
              />
              <Link
                href={{
                  pathname: '/tv-series/[tv_series_id]/details',
                  params: { tv_series_id: series.id },
                }}
                asChild
              >
                <Button
                  variant="outline"
                  style={{
                    marginLeft: insets.left + theme.spaces.horizontal,
                    marginRight: insets.right + theme.spaces.horizontal,
                  }}
                >
                  {upperFirst(t('common.messages.see_more_details'))}
                </Button>
              </Link>
            </View>
            <TvSeriesTrailers tvSeries={series} />
            <TvSeriesWidgetPlaylists
              tvSeriesId={series.id}
              url={{
                pathname: '/tv-series/[tv_series_id]/playlists',
                params: { tv_series_id: series.id },
              }}
              containerStyle={{
                paddingLeft: insets.left + theme.spaces.horizontal,
                paddingRight: insets.right + theme.spaces.horizontal,
              }}
              labelStyle={{
                paddingLeft: insets.left + theme.spaces.horizontal,
                paddingRight: insets.right + theme.spaces.horizontal,
              }}
            />
            <TvSeriesWidgetReviews
              tvSeries={series}
              url={{
                pathname: '/tv-series/[tv_series_id]/reviews',
                params: { tv_series_id: series.id },
              }}
              containerStyle={{
                paddingLeft: insets.left + theme.spaces.horizontal,
                paddingRight: insets.right + theme.spaces.horizontal,
              }}
              labelStyle={{
                paddingLeft: insets.left + theme.spaces.horizontal,
                paddingRight: insets.right + theme.spaces.horizontal,
              }}
            />
          </View>
        )}
      </AnimatedContentContainer>
      {series && user && (
        <FloatingBar height={floatingBarHeight} containerStyle={{ paddingHorizontal: 0 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              tw`items-center gap-2`,
              {
                paddingHorizontal: theme.spaces.horizontal,
                paddingVertical: theme.spaces.md,
              },
            ]}
          >
            <ButtonUserLogTvSeries tvSeries={series} />
            <ButtonUserBookmark
              mediaId={series.id}
              mediaType="tv_series"
              mediaTitle={series.name}
            />
            <ButtonPlaylistAdd mediaId={series.id} mediaType="tv_series" mediaTitle={series.name} />
            <ButtonUserRecoSend
              mediaId={series.id}
              mediaType="tv_series"
              mediaTitle={series.name}
            />
          </ScrollView>
        </FloatingBar>
      )}
    </>
  );
};

const TvSeriesSynopsis = ({
  tvSeries,
  style,
  containerStyle,
  numberOfLines = 5,
  ...props
}: Omit<TextProps, 'children'> & { tvSeries: TvSeries; containerStyle: ViewProps['style'] }) => {
  const t = useTranslations();
  const { colors } = useTheme();
  const [showFullSynopsis, setShowFullSynopsis] = useState<boolean>(false);

  const toggleSynopsis = useCallback(() => {
    setShowFullSynopsis((prev) => !prev);
  }, []);

  if (!tvSeries.overview || tvSeries.overview.length === 0) return null;
  return (
    <Pressable style={[containerStyle]} onPress={toggleSynopsis}>
      <Text
        style={[tw`text-sm`, { color: colors.mutedForeground }, style]}
        numberOfLines={showFullSynopsis ? undefined : numberOfLines}
        ellipsizeMode="tail"
        {...props}
      >
        <Text style={tw`text-sm font-medium`}>
          {`${upperFirst(t('common.messages.overview'))} : `}
        </Text>
        {tvSeries.overview}
      </Text>
    </Pressable>
  );
};

const TvSeriesOriginalTitle = ({
  tvSeries,
  style,
  numberOfLines = 1,
  ...props
}: Omit<TextProps, 'children'> & { tvSeries: TvSeries }) => {
  const t = useTranslations();
  const { colors } = useTheme();

  if (!tvSeries.originalName || lowerCase(tvSeries.originalName) === lowerCase(tvSeries.name!))
    return null;
  return (
    <Text
      style={[tw`text-sm`, { color: colors.mutedForeground }, style]}
      numberOfLines={numberOfLines}
      {...props}
    >
      <Text style={tw`text-sm font-medium`}>
        {`${upperFirst(t('common.messages.original_title'))} : `}
      </Text>
      {tvSeries.originalName}
    </Text>
  );
};

const TvSeriesTrailers = ({ tvSeries }: { tvSeries: TvSeries }) => {
  const { colors, theme } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  // UI
  const { width } = useWindowDimensions();
  const playerWidth = width - theme.spaces.horizontal * 2;
  const playerHeight = (playerWidth * 9) / 16;
  // States
  const [selectedTrailer, setSelectedTrailer] = useState<TvSeriesTrailer | null>(
    tvSeries.trailers?.at(0) || null,
  );
  const normalizedSite = useMemo(() => selectedTrailer?.site.toLowerCase(), [selectedTrailer]);
  // Render
  const renderItem = useCallback(
    ({ item }: { item: TvSeriesTrailer }) => {
      const label =
        item.iso6391 === tvSeries.originalLanguage ? 'VO' : item.iso6391?.toUpperCase() || 'N/A';
      return (
        <Button
          variant={item.id === selectedTrailer?.id ? 'accent-yellow' : 'outline'}
          onPress={() => setSelectedTrailer(item)}
          style={{ borderRadius: theme.border.radius.full }}
        >
          {label}
        </Button>
      );
    },
    [selectedTrailer, tvSeries.originalLanguage, theme],
  );
  if (!tvSeries.trailers?.length || !selectedTrailer) return null;
  return (
    <View style={{ gap: theme.spaces.md }}>
      <View
        style={[
          tw`flex-row items-center`,
          {
            gap: theme.spaces.md,
            marginLeft: insets.left + theme.spaces.horizontal,
            marginRight: insets.right + theme.spaces.horizontal,
          },
        ]}
      >
        <Icons.PlayCircle color={colors.foreground} />
        <Text style={tw`text-lg font-medium`}>
          {upperFirst(t('common.messages.trailer', { count: 2 }))}
        </Text>
      </View>
      <View
        style={{
          marginLeft: insets.left + theme.spaces.horizontal,
          marginRight: insets.right + theme.spaces.horizontal,
        }}
      >
        {normalizedSite === 'youtube' ? (
          <YoutubePlayer height={playerHeight} videoId={selectedTrailer.key} />
        ) : normalizedSite === 'vimeo' ? (
          <Vimeo
            videoId={selectedTrailer.key}
            params={'api=1&controls=1'}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
          />
        ) : (
          <View
            style={[
              tw`items-center justify-center`,
              { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.muted },
            ]}
          >
            <Text style={{ color: colors.mutedForeground }}>
              {upperFirst(t('common.messages.trailer', { count: 1 }))} not supported.
            </Text>
          </View>
        )}
      </View>
      <LegendList
        data={tvSeries.trailers || []}
        extraData={selectedTrailer}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          gap: theme.spaces.md,
        }}
      />
    </View>
  );
};

export default TvSeriesScreen;
