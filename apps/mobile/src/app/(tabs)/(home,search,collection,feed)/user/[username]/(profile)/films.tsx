import { Icons } from '../../../../../../constants/Icons';
import tw from '../../../../../../lib/tw';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import type { LegendListRef } from '@legendapp/list/react-native';
import {
  useProfileTab,
  useProfileTabs,
} from '../../../../../../components/screens/user/profile/ProfileTabsProvider';
import { upperFirst } from 'lodash';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { CardMovie } from '../../../../../../components/cards/CardMovie';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userMovieLogsInfiniteOptions } from '@libs/query-client';
import { CardError } from '../../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../../components/cards/CardEmpty';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAndroid } from '../../../../../../platform/detection';
import { useTheme } from '../../../../../../providers/ThemeProvider';

interface sortBy {
  label: string;
  value: 'rating' | 'updated_at' | 'first_watched_at' | 'random';
}

const UserCollectionMovieScreen = () => {
  const t = useTranslations();
  const { profile } = useProfileTabs();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  // States
  const sortByOptions = useMemo(
    (): sortBy[] => [
      { label: upperFirst(t('common.messages.updated_at')), value: 'updated_at' },
      { label: upperFirst(t('common.messages.first_watched_at')), value: 'first_watched_at' },
      { label: upperFirst(t('common.messages.rating')), value: 'rating' },
      { label: upperFirst(t('common.messages.random')), value: 'random' },
    ],
    [t],
  );
  const [sortBy, setSortBy] = useState<sortBy>(sortByOptions[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isError } = useInfiniteQuery(
    userMovieLogsInfiniteOptions({
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
    [setSortBy, setSortOrder, sortBy.value, sortByOptions, sortOrder, t],
  );

  // Only a pull by hand turns the indicator on. `isRefetching` is true for any
  // refetch -- a tab coming back into focus, a query going stale -- and the
  // control would then show itself already spinning, so the next small drag
  // would read as a refresh that has just finished.
  const [isPulling, setIsPulling] = useState(false);
  const onPullToRefresh = useCallback(async () => {
    setIsPulling(true);
    try {
      await refetch();
    } finally {
      setIsPulling(false);
    }
  }, [refetch]);

  const listRef = useRef<LegendListRef>(null);
  const { scrollOffset, overlayHeight, syncOffsets } = useProfileTab('films', {
    scrollToOffset: ({ offset, animated }) => listRef.current?.scrollToOffset({ offset, animated }),
    menu: sortMenu,
  });
  const movies = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  return (
    <AnimatedLegendList
      ref={listRef}
      sharedValues={{ scrollOffset }}
      scrollIndicatorInsets={{ top: overlayHeight, bottom: insets.bottom }}
      automaticallyAdjustsScrollIndicatorInsets={false}
      data={movies}
      renderItem={({ item: { movie, ...log } }) => (
        <CardMovie
          variant="poster"
          movie={movie}
          profile={{
            log: log,
            user: profile!,
          }}
          href={
            profile
              ? {
                  pathname: '/user/[username]/film/[film_id]',
                  params: {
                    username: profile.username,
                    film_id: movie.id,
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
            <CardEmpty icon={'🎬'} label={t('common.messages.no_films')} />
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
        // So the empty state has the screen to centre itself in.
        flexGrow: 1,
      }}
      maintainVisibleContentPosition={false}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={() => hasNextPage && fetchNextPage()}
      // The list adds its own top padding to the indicator's offset. On iOS
      // that would drop the indicator below the profile header, so the padding
      // is cancelled and it sits at the top of the list, coming into view in
      // the gap the header leaves as it follows the bounce down. Android has
      // no bounce and nothing moves, so the padding is what keeps its circle
      // from coming down behind the header.
      progressViewOffset={isAndroid ? 0 : -(overlayHeight + theme.spaces.md)}
      refreshing={isPulling}
      onRefresh={onPullToRefresh}
      onScrollEndDrag={() => syncOffsets()}
      onMomentumScrollEnd={() => syncOffsets()}
    />
  );
};

export default UserCollectionMovieScreen;
