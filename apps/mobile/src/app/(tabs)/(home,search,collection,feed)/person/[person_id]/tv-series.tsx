import { getIdFromSlug } from '../../../../../utils/getIdFromSlug';
import { Stack, useLocalSearchParams } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { HeaderTitle } from '@react-navigation/elements';
import { LegendList } from '@legendapp/list/react-native';
import tw from '../../../../../lib/tw';
import { Button } from '../../../../../components/ui/Button';
import { Icons } from '../../../../../constants/Icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { Text } from '../../../../../components/ui/text';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { CardTvSeries } from '../../../../../components/cards/CardTvSeries';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { personOptions, personTvSeriesInfiniteOptions } from '@libs/query-client';
import { PersonTvSeries } from '@libs/api-js';

interface sortBy {
  label: string;
  value: 'last_air_date' | 'popularity' | 'vote_average';
}

const PersonTvSeriesScreen = () => {
  const t = useTranslations();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { person_id } = useLocalSearchParams<{ person_id: string }>();
  const { id: personId } = getIdFromSlug(person_id);
  const { colors, bottomOffset, tabBarHeight } = useTheme();
  const { showActionSheetWithOptions } = useActionSheet();
  // States
  const sortByOptions = useMemo(
    (): sortBy[] => [
      { label: upperFirst(t('common.messages.last_air_date')), value: 'last_air_date' },
      { label: upperFirst(t('common.messages.popularity')), value: 'popularity' },
      { label: upperFirst(t('common.messages.vote_average')), value: 'vote_average' },
    ],
    [t],
  );
  const [sortBy, setSortBy] = useState<sortBy>(sortByOptions[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Queries
  const { data: person } = useQuery(
    personOptions({
      personId,
    }),
  );
  const { data, isLoading, fetchNextPage, hasNextPage, isRefetching, refetch } = useInfiniteQuery(
    personTvSeriesInfiniteOptions({
      personId: personId,
      filters: {
        sort_by: sortBy.value,
        sort_order: sortOrder,
      },
    }),
  );
  const tvSeries = useMemo(() => data?.pages.flatMap((page) => page.data), [data]);
  const loading = useMemo(() => data === undefined || isLoading, [data, isLoading]);
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

  const renderItem = useCallback(
    ({ item: { tvSeries } }: { item: PersonTvSeries }) => (
      <CardTvSeries variant="poster" tvSeries={tvSeries} style={tw`w-full`} />
    ),
    [],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: person?.name || '',
          headerTitle: (props) => (
            <HeaderTitle {...props}>
              {upperFirst(t('common.messages.tv_series', { count: 2 }))}
            </HeaderTitle>
          ),
        }}
      />
      <LegendList
        data={tvSeries}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={tw`flex flex-row justify-end items-center gap-2 py-2`}>
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
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          gap: GAP,
          paddingBottom: bottomOffset + PADDING_VERTICAL,
          paddingHorizontal: PADDING_HORIZONTAL,
        }}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
        keyExtractor={(item) => item.tvSeries.id.toString()}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </>
  );
};

export default PersonTvSeriesScreen;
