import { getIdFromSlug } from '../../../../../utils/getIdFromSlug';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useAuth } from '../../../../../providers/AuthProvider';
import { useWindowDimensions, View } from 'react-native';
import tw from '../../../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { LegendList } from '@legendapp/list/react-native';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '../../../../../components/ui/Button';
import { Icons } from '../../../../../constants/Icons';
import { CardPlaylist } from '../../../../../components/cards/CardPlaylist';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tvSeriesOptions, tvSeriesPlaylistsInfiniteOptions } from '@libs/query-client';
import { PlaylistWithOwner } from '@libs/api-js';
import { CardError } from '../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../components/cards/CardEmpty';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIOS } from '../../../../../platform/detection';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useTheme } from '../../../../../providers/ThemeProvider';

interface sortBy {
  label: string;
  value: 'updated_at' | 'created_at' | 'likes_count';
}

const TvSeriesPlaylists = () => {
  const t = useTranslations();
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { user } = useAuth();
  const { tv_series_id } = useLocalSearchParams<{ tv_series_id: string }>();
  const { id: seriesId } = getIdFromSlug(tv_series_id);
  const insets = useSafeAreaInsets();
  const navigationHeaderHeight = useHeaderHeight();
  const { isLiquidGlassAvailable } = useTheme();
  const { showActionSheetWithOptions } = useActionSheet();
  // States
  const sortByOptions = useMemo(
    (): sortBy[] => [
      { label: upperFirst(t('common.messages.date_updated')), value: 'updated_at' },
      { label: upperFirst(t('common.messages.date_created')), value: 'created_at' },
      { label: upperFirst(t('common.messages.number_of_likes')), value: 'likes_count' },
    ],
    [t],
  );
  const [sortBy, setSortBy] = useState<sortBy>(sortByOptions[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Requests
  const { data: tvSeries } = useQuery(tvSeriesOptions({ tvSeriesId: seriesId }));
  const { data, isLoading, fetchNextPage, hasNextPage, isRefetching, refetch, isError } =
    useInfiniteQuery(
      tvSeriesPlaylistsInfiniteOptions({
        tvSeriesId: seriesId,
        filters: {
          sort_by: sortBy.value,
          sort_order: sortOrder,
        },
      }),
    );
  const playlists = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
  // Handlers
  const handleSortBy = () => {
    const sortByOptionsWithCancel = [
      ...sortByOptions,
      { label: upperFirst(t('common.messages.cancel')), value: 'cancel' },
    ];
    const cancelIndex = sortByOptionsWithCancel.length - 1;
    showActionSheetWithOptions(
      {
        options: sortByOptionsWithCancel.map((option) => option.label),
        disabledButtonIndices: sortByOptions
          ? [sortByOptionsWithCancel.findIndex((option) => option.value === sortBy.value)]
          : [],
        cancelButtonIndex: cancelIndex,
      },
      (selectedIndex) => {
        if (selectedIndex === undefined || selectedIndex === cancelIndex) return;
        setSortBy(sortByOptionsWithCancel[selectedIndex] as sortBy);
      },
    );
  };

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const renderItem = useCallback(
    ({ item: { owner, ...playlist } }: { item: PlaylistWithOwner }) => (
      <CardPlaylist playlist={playlist} owner={owner} />
    ),
    [],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
          headerRight: () =>
            user ? (
              <Button
                variant="ghost"
                size="icon"
                icon={Icons.AddPlaylist}
                style={tw`rounded-full`}
                onPress={() => {
                  router.push({
                    pathname: '/playlist/add/[type]/[id]',
                    params: {
                      type: 'tv-series',
                      id: seriesId,
                      title: tvSeries?.name,
                    },
                  });
                }}
              />
            ) : null,
          unstable_headerRightItems: () => [
            ...(user
              ? [
                  {
                    type: 'button' as const,
                    label: upperFirst(t('common.messages.add_to_playlist')),
                    onPress: () => {
                      router.push({
                        pathname: '/playlist/add/[type]/[id]',
                        params: {
                          type: 'tv-series',
                          id: seriesId,
                          title: tvSeries?.name,
                        },
                      });
                    },
                    icon: {
                      name: 'text.badge.plus' as const,
                      type: 'sfSymbol' as const,
                    },
                  },
                ]
              : []),
            {
              type: 'menu' as const,
              label: upperFirst(t('common.messages.sort_by')),
              icon: {
                type: 'sfSymbol' as const,
                name: (sortOrder === 'desc' ? 'arrow.down' : 'arrow.up') as
                  | 'arrow.down'
                  | 'arrow.up',
              },
              menu: {
                title: upperFirst(t('common.messages.sort_by')),
                // Tapping the already-active field flips the order instead of no-op'ing —
                // the order (asc/desc) isn't a separate selectable group, since a native
                // switch control isn't available as a menu item type in this API.
                items: sortByOptions.map((option) => {
                  const isActive = option.value === sortBy.value;
                  return {
                    type: 'action' as const,
                    label: option.label,
                    description: isActive
                      ? upperFirst(
                          t(
                            sortOrder === 'desc'
                              ? 'common.messages.order_desc'
                              : 'common.messages.order_asc',
                          ),
                        )
                      : undefined,
                    state: (isActive ? 'on' : 'off') as 'on' | 'off',
                    onPress: () => {
                      if (isActive) {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy(option);
                      }
                    },
                  };
                }),
              },
            },
          ],
        }}
      />
      <LegendList
        data={playlists}
        renderItem={renderItem}
        ListHeaderComponent={
          isIOS ? undefined : (
            <View style={tw.style('flex flex-row justify-end items-center gap-2 py-2')}>
              <Button
                icon={sortOrder === 'desc' ? Icons.ArrowDown : Icons.ArrowUp}
                variant="muted"
                size="icon"
                onPress={handleSortOrderToggle}
              />
              <Button icon={Icons.ChevronDown} variant="muted" onPress={handleSortBy}>
                {sortBy.label}
              </Button>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={tw`flex-1 items-center justify-center`}>
            {isLoading ? (
              <Icons.Loader />
            ) : isError ? (
              <CardError />
            ) : (
              <CardEmpty icon={'📚'} label={t('common.messages.no_playlists')} />
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
        onEndReached={useCallback(
          () => hasNextPage && fetchNextPage(),
          [hasNextPage, fetchNextPage],
        )}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          paddingTop: navigationHeaderHeight,
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingBottom: insets.bottom + PADDING_VERTICAL,
          gap: GAP,
        }}
        maintainVisibleContentPosition={false}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={tw`gap-2`}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </>
  );
};

export default TvSeriesPlaylists;
