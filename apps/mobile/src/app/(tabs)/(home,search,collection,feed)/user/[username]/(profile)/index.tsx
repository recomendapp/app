import { useCallback, useMemo, useRef } from 'react';
import { RefreshControl } from 'react-native';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import type { LegendListRef } from '@legendapp/list/react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userFeedInfiniteOptions } from '@libs/query-client';
import type { FeedItem } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { CardEmpty } from '../../../../../../components/cards/CardEmpty';
import { CardError } from '../../../../../../components/cards/CardError';
import { CardFeedLogMovie } from '../../../../../../components/cards/feed/CardFeedLogMovie';
import { CardFeedLogTvSeries } from '../../../../../../components/cards/feed/CardFeedLogTvSeries';
import { CardFeedPlaylistLike } from '../../../../../../components/cards/feed/CardFeedPlaylistLike';
import { CardFeedReviewMovieLike } from '../../../../../../components/cards/feed/CardFeedReviewMovieLike';
import { CardFeedReviewTvSeriesLike } from '../../../../../../components/cards/feed/CardFeedReviewTvSeriesLike';
import ProfileTabContent from '../../../../../../components/screens/user/profile/ProfileTabContent';
import {
  useProfileTab,
  useProfileTabs,
} from '../../../../../../components/screens/user/profile/ProfileTabsProvider';
import { Text } from '../../../../../../components/ui/text';
import { View } from '../../../../../../components/ui/view';
import { Icons } from '../../../../../../constants/Icons';
import tw from '../../../../../../lib/tw';
import { isAndroid } from '../../../../../../platform/detection';
import { useTheme } from '../../../../../../providers/ThemeProvider';

const ProfileFeedScreen = () => {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { profile, refreshProfile } = useProfileTabs();

  const { data, isLoading, isError, isRefetching, refetch, fetchNextPage, hasNextPage } =
    useInfiniteQuery(userFeedInfiniteOptions({ userId: profile?.id }));
  const feed = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const refresh = useCallback(
    () => Promise.all([refreshProfile(), refetch()]),
    [refetch, refreshProfile],
  );

  const listRef = useRef<LegendListRef>(null);
  const { scrollOffset, scrollRef, overlayHeight, releasePull, syncOffsets } = useProfileTab(
    'index',
    {
      scrollToOffset: ({ offset, animated }) =>
        listRef.current?.scrollToOffset({ offset, animated }),
      refresh,
    },
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
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

  return (
    <ProfileTabContent>
      <AnimatedLegendList
        ref={listRef}
        sharedValues={{ scrollOffset }}
        refScrollView={scrollRef}
        scrollIndicatorInsets={{ top: overlayHeight, bottom: insets.bottom }}
        automaticallyAdjustsScrollIndicatorInsets={false}
        data={feed}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={tw`flex-1 items-center justify-center`}>
            {isLoading ? (
              <Icons.Loader />
            ) : isError ? (
              <CardError />
            ) : (
              <CardEmpty icon={'⚡️'} label={t('common.messages.this_user_has_no_activity')} />
            )}
          </View>
        }
        refreshControl={
          isAndroid ? (
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refresh}
              progressViewOffset={overlayHeight}
            />
          ) : undefined
        }
        onScrollEndDrag={() => {
          releasePull();
          syncOffsets();
        }}
        onMomentumScrollEnd={() => syncOffsets()}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        maintainVisibleContentPosition={false}
        contentContainerStyle={{
          gap: theme.spaces.md,
          paddingTop: overlayHeight + theme.spaces.md,
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          paddingBottom: insets.bottom + theme.spaces.md,
          flexGrow: 1,
        }}
        nestedScrollEnabled
      />
    </ProfileTabContent>
  );
};

export default ProfileFeedScreen;
