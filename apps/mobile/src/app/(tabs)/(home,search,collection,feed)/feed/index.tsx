import tw from '../../../../lib/tw';
import { LegendList, LegendListRef } from '@legendapp/list/react-native';
import { View } from '../../../../components/ui/view';
import { Text } from '../../../../components/ui/text';
import { useTranslations } from 'use-intl';
import { useTheme } from '../../../../providers/ThemeProvider';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../theme/globals';
import { CardFeedLogMovie } from '../../../../components/cards/feed/CardFeedLogMovie';
import { CardFeedPlaylistLike } from '../../../../components/cards/feed/CardFeedPlaylistLike';
import { CardFeedReviewMovieLike } from '../../../../components/cards/feed/CardFeedReviewMovieLike';
import { CardFeedReviewTvSeriesLike } from '../../../../components/cards/feed/CardFeedReviewTvSeriesLike';
import { useScrollToTop } from '@react-navigation/native';
import { useCallback, useMemo, useRef } from 'react';
import { Icons } from '../../../../constants/Icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../providers/AuthProvider';
import { FeedItem } from '@libs/api-js';
import { CardFeedLogTvSeries } from '../../../../components/cards/feed/CardFeedLogTvSeries';
import { meFeedInfiniteOptions } from '@libs/query-client';
import { RefreshableStateContainer } from '../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../components/cards/CardError';
import { CardEmpty } from 'apps/mobile/src/components/cards/CardEmpty';

const FeedScreen = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { bottomOffset, tabBarHeight, colors } = useTheme();
  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching, isError } =
    useInfiniteQuery(
      meFeedInfiniteOptions({
        userId: user?.id,
      }),
    );
  const feed = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  // REFs
  const scrollRef = useRef<LegendListRef>(null);
  useScrollToTop(scrollRef);

  // Render
  const renderItem = useCallback(
    ({ item }: { item: FeedItem; index: number }) => {
      switch (item.activityType) {
        case 'log_movie':
          return <CardFeedLogMovie data={item} />;
        case 'log_tv_series':
          return <CardFeedLogTvSeries data={item} />;
        case 'playlist_like':
          return <CardFeedPlaylistLike data={item} />;
        case 'review_movie_like':
          return <CardFeedReviewMovieLike data={item} />;
        case 'review_tv_series_like':
          return <CardFeedReviewTvSeriesLike data={item} />;
        default:
          return (
            <View style={[{ backgroundColor: colors.muted }, tw`p-4 rounded-md`]}>
              <Text textColor="muted" style={tw`text-center`}>
                Unsupported activity type
              </Text>
            </View>
          );
      }
    },
    [colors.muted],
  );

  if (isLoading) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <Icons.Loader />
      </RefreshableStateContainer>
    );
  }

  if (isError) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <CardError />
      </RefreshableStateContainer>
    );
  }

  if (feed.length === 0) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <CardEmpty icon={'⚡️'} label={t('help_hints.feed.message')} />
      </RefreshableStateContainer>
    );
  }

  return (
    <LegendList
      ref={scrollRef}
      data={feed}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingHorizontal: PADDING_HORIZONTAL,
        paddingBottom: bottomOffset + PADDING_VERTICAL,
        gap: GAP,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{
        bottom: tabBarHeight,
      }}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
      onEndReachedThreshold={0.3}
      nestedScrollEnabled
      onRefresh={refetch}
    />
  );
};

export default FeedScreen;
