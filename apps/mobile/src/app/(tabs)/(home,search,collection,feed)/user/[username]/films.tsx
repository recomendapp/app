import { Button } from '../../../../../components/ui/Button';
import { Icons } from '../../../../../constants/Icons';
import tw from '../../../../../lib/tw';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { LegendList } from '@legendapp/list/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { CardMovie } from '../../../../../components/cards/CardMovie';
import { HeaderTitle } from '@react-navigation/elements';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { userByUsernameOptions, userMovieLogsInfiniteOptions } from '@libs/query-client';

interface sortBy {
  label: string;
  value: 'rating' | 'updated_at' | 'first_watched_at' | 'random';
}

const UserCollectionMovieScreen = () => {
  const t = useTranslations();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: profile } = useQuery(userByUsernameOptions({ username: username }));
  const { colors, bottomOffset, tabBarHeight } = useTheme();
  const { showActionSheetWithOptions } = useActionSheet();
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
  const { data, isLoading, fetchNextPage, hasNextPage, isRefetching, refetch } = useInfiniteQuery(
    userMovieLogsInfiniteOptions({
      userId: profile?.id,
      filters: {
        sort_by: sortBy.value,
        sort_order: sortOrder,
      },
    }),
  );
  const movies = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
  const loading = data === undefined || isLoading;
  // Handlers
  const handleSortBy = useCallback(() => {
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
  }, [sortByOptions, showActionSheetWithOptions, sortBy.value, t]);

  return (
    <>
      <Stack.Screen
        options={{
          title: profile ? `@${profile.username}` : '',
          headerTitle: (props) => (
            <HeaderTitle {...props}>
              {upperFirst(t('common.messages.film', { count: 2 }))}
            </HeaderTitle>
          ),
        }}
      />
      <LegendList
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
        ListHeaderComponent={
          <View style={tw.style('flex flex-row justify-end items-center gap-2 py-2')}>
            <Button
              icon={sortOrder === 'desc' ? Icons.ArrowDown : Icons.ArrowUp}
              variant="muted"
              size="icon"
              onPress={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            />
            <Button icon={Icons.ChevronDown} variant="muted" onPress={handleSortBy}>
              {sortBy.label}
            </Button>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Icons.Loader />
          ) : (
            <View style={tw`flex-1 items-center justify-center p-4`}>
              <Text style={[tw`text-center`, { color: colors.mutedForeground }]}>
                {upperFirst(t('common.messages.no_results'))}
              </Text>
            </View>
          )
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
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          gap: GAP,
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingBottom: bottomOffset + PADDING_VERTICAL,
        }}
        scrollIndicatorInsets={{
          bottom: tabBarHeight,
        }}
        maintainVisibleContentPosition={false}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </>
  );
};

export default UserCollectionMovieScreen;
