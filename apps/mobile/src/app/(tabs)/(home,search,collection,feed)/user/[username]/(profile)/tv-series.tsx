import { Icons } from '../../../../../../constants/Icons';
import tw from '../../../../../../lib/tw';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import type { LegendListRef } from '@legendapp/list/react-native';
import ProfileTabContent from '../../../../../../components/screens/user/profile/ProfileTabContent';
import {
  useProfileTab,
  useProfileTabs,
} from '../../../../../../components/screens/user/profile/ProfileTabsProvider';
import { upperFirst } from 'lodash';
import { useMemo, useRef, useState } from 'react';
import { RefreshControl, useWindowDimensions, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { CardTvSeries } from '../../../../../../components/cards/CardTvSeries';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userTvSeriesLogsInfiniteOptions } from '@libs/query-client';
import { CardError } from '../../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../../components/cards/CardEmpty';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAndroid } from '../../../../../../platform/detection';
import { useTheme } from '../../../../../../providers/ThemeProvider';

interface sortBy {
  label: string;
  value: 'rating' | 'updated_at' | 'random';
}

const UserCollectionTvSeries = () => {
  const t = useTranslations();
  const { profile } = useProfileTabs();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  // States
  const sortByOptions = useMemo(
    (): sortBy[] => [
      { label: upperFirst(t('common.messages.updated_at')), value: 'updated_at' },
      { label: upperFirst(t('common.messages.rating')), value: 'rating' },
      { label: upperFirst(t('common.messages.random')), value: 'random' },
    ],
    [t],
  );
  const [sortBy, setSortBy] = useState<sortBy>(sortByOptions[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, fetchNextPage, hasNextPage, isRefetching, refetch, isError } =
    useInfiniteQuery(
      userTvSeriesLogsInfiniteOptions({
        userId: profile?.id,
        filters: {
          sort_by: sortBy.value,
          sort_order: sortOrder,
        },
      }),
    );
  // Tapping the field already in use flips the order: the menu is the only
  // sort control, so it has to hold both choices.
  const sortMenu = useMemo(
    () => ({
      title: upperFirst(t('common.messages.sort_by')),
      items: sortByOptions.map((option) => {
        const isActive = option.value === sortBy.value;

        return {
          label: option.label,
          // The field in use says which way it runs, and taking it again is
          // what turns it around.
          description: isActive
            ? upperFirst(
                t(
                  sortOrder === 'desc' ? 'common.messages.order_desc' : 'common.messages.order_asc',
                ),
              )
            : undefined,
          selected: isActive,
          systemImage: isActive
            ? sortOrder === 'desc'
              ? ('arrow.down' as const)
              : ('arrow.up' as const)
            : undefined,
          onPress: () => {
            if (isActive) {
              setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortBy(option);
            }
          },
        };
      }),
    }),
    [sortBy.value, sortByOptions, sortOrder, t],
  );

  const listRef = useRef<LegendListRef>(null);
  const { scrollOffset, scrollRef, overlayHeight, releasePull, syncOffsets } = useProfileTab(
    'tv-series',
    {
      scrollToOffset: ({ offset, animated }) =>
        listRef.current?.scrollToOffset({ offset, animated }),
      refresh: refetch,
      menu: sortMenu,
    },
  );
  const tvSeries = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  return (
    <ProfileTabContent>
      <AnimatedLegendList
        ref={listRef}
        sharedValues={{ scrollOffset }}
        refScrollView={scrollRef}
        scrollIndicatorInsets={{ top: overlayHeight, bottom: insets.bottom }}
        automaticallyAdjustsScrollIndicatorInsets={false}
        data={tvSeries}
        renderItem={({ item: { tvSeries, ...log } }) => (
          <CardTvSeries
            variant="poster"
            tvSeries={tvSeries}
            profile={{
              log: log,
              user: profile!,
            }}
            href={
              profile
                ? {
                    pathname: '/user/[username]/tv-series/[tv_series_id]',
                    params: {
                      username: profile.username,
                      tv_series_id: tvSeries.id,
                    },
                  }
                : undefined
            }
            style={tw`w-full`}
          />
        )}
        ListEmptyComponent={
          <View style={tw`flex-1 items-center justify-center`}>
            {isLoading ? (
              <Icons.Loader />
            ) : isError ? (
              <CardError />
            ) : (
              <CardEmpty icon={'📺'} label={t('common.messages.no_tv_series')} />
            )}
          </View>
        }
        numColumns={
          SCREEN_WIDTH < 360
            ? 2
            : SCREEN_WIDTH < 414
              ? 3
              : SCREEN_WIDTH < 600
                ? 4
                : SCREEN_WIDTH < 768
                  ? 5
                  : 6
        }
        onEndReachedThreshold={1}
        contentContainerStyle={{
          gap: theme.spaces.md,
          paddingTop: overlayHeight + theme.spaces.md,
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          paddingBottom: insets.bottom + theme.spaces.md,
        }}
        maintainVisibleContentPosition={false}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshControl={
          isAndroid ? <RefreshControl refreshing={isRefetching} onRefresh={refetch} /> : undefined
        }
        onScrollEndDrag={() => {
          releasePull();
          syncOffsets();
        }}
        onMomentumScrollEnd={() => syncOffsets()}
      />
    </ProfileTabContent>
  );
};

export default UserCollectionTvSeries;
