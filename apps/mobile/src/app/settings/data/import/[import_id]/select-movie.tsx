import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchMoviesInfiniteOptions } from '@libs/query-client';
import { MovieCompact } from '@libs/api-js';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import { ImageWithFallback } from '../../../../../components/utils/ImageWithFallback';
import { Icons } from '../../../../../constants/Icons';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { useSelectionResolver } from '../../../../../stores/useSelectionStore/useSelectionResolver';
import { getTmdbImage } from '../../../../../lib/tmdb/getTmdbImage';
import useDebounce from '../../../../../hooks/useDebounce';
import tw from '../../../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { KeyboardAwareLegendList } from '@legendapp/list/keyboard';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';

const SettingsDataImportSelectMovieScreen = () => {
  const t = useTranslations();
  const { colors, mode, isLiquidGlassAvailable } = useTheme();
  const insets = useSafeAreaInsets();
  const navigationHeaderHeight = useHeaderHeight();
  const modalHeaderOptions = useModalHeaderOptions();
  const formatter = useFormatter();
  const resolve = useSelectionResolver('movie');
  const [search, setSearch] = useState('');
  const query = useDebounce(search);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    ...searchMoviesInfiniteOptions({ filters: { q: query, per_page: 20 } }),
    enabled: query.length > 0,
  });
  const results = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const renderItem = useCallback(
    ({ item }: { item: MovieCompact }) => {
      const directorNames = item.directors
        .map((director) => director.name)
        .filter((name): name is string => !!name);
      return (
        <Pressable onPress={() => resolve(item)} style={tw`flex-row items-center gap-3 p-1`}>
          <ImageWithFallback
            source={{ uri: getTmdbImage({ path: item.posterPath, size: 'w185' }) }}
            alt={item.title ?? ''}
            type="movie"
            style={{ width: 45, aspectRatio: 2 / 3 }}
          />
          <View style={tw`flex-1 flex-row items-center justify-between gap-2`}>
            <View style={tw`shrink gap-1`}>
              <Text numberOfLines={2}>{item.title}</Text>
              {directorNames.length > 0 && (
                <Text style={tw`text-sm`} textColor="muted" numberOfLines={1}>
                  {formatter.list(directorNames)}
                </Text>
              )}
            </View>
            {item.releaseDate && (
              <Text textColor="muted" style={tw`text-sm`}>
                {new Date(item.releaseDate).getFullYear()}
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [resolve, formatter],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTitle: upperFirst(t('common.messages.search_film', { count: 1 })),
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
          headerSearchBarOptions: {
            autoCapitalize: 'none',
            placeholder: upperFirst(t('common.messages.search_film', { count: 1 })),
            onChangeText: (e) => setSearch(e.nativeEvent.text),
            hideNavigationBar: false,
            allowToolbarIntegration: false,
            hideWhenScrolling: false,
            autoFocus: true,
          },
        }}
      />
      <KeyboardAwareLegendList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={tw`h-2`} />}
        contentContainerStyle={{
          gap: GAP,
          paddingTop: navigationHeaderHeight,
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingBottom: insets.bottom + PADDING_VERTICAL,
        }}
        ListEmptyComponent={() =>
          isLoading ? (
            <Icons.Loader />
          ) : query.length > 0 ? (
            <Text textColor="muted" style={tw`text-center`}>
              {upperFirst(t('common.messages.no_results'))}
            </Text>
          ) : null
        }
        indicatorStyle={mode === 'dark' ? 'white' : 'black'}
        onEndReached={() => hasNextPage && fetchNextPage()}
        ListFooterComponent={
          isFetchingNextPage ? <Icons.Loader color={colors.mutedForeground} /> : null
        }
      />
    </>
  );
};

export default SettingsDataImportSelectMovieScreen;
