import { CardTvSeries } from '../../../../../components/cards/CardTvSeries';
import ErrorMessage from '../../../../../components/ErrorMessage';
import { Text } from '../../../../../components/ui/text';
import TrueSheet from '../../../../../components/ui/TrueSheet';
import { View } from '../../../../../components/ui/view';
import { Icons } from '../../../../../constants/Icons';
import tw from '../../../../../lib/tw';
import useSearchStore from '../../../../../stores/useSearchStore';
import { LegendList, LegendListRef } from '@legendapp/list/react-native';
import { TrueSheet as RNTrueSheet } from '@lodev09/react-native-true-sheet';
import { useScrollToTop } from 'expo-router/react-navigation';
// import { useNavigation } from "expo-router";
import { upperFirst } from 'lodash';
import { useRef, forwardRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchTvSeriesInfiniteOptions } from '@libs/query-client';
import { useTheme } from '../../../../../providers/ThemeProvider';

// const FiltersButton = ({ onPress }: { onPress: () => void }) => {
// 	return (
// 		<View
// 		style={[
// 			tw`flex-row items-center`,
// 			{ gap: theme.spaces.md }
// 		]}
// 		>
// 			<Button
// 				variant="ghost"
// 				icon={Icons.Filters}
// 				size="icon"
// 				onPress={onPress}
// 			/>
// 		</View>
// 	);
// };

const FiltersSheet = forwardRef<RNTrueSheet>((_, ref) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations();

  return (
    <TrueSheet ref={ref} detents={['auto']} scrollable>
      <ScrollView
        bounces={false}
        contentContainerStyle={{
          paddingTop: theme.spaces.md,
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          backgroundColor: 'red', // TODO: Remove debug style
        }}
      >
        <Text>Filters TV SERIES</Text>
        <View>
          <Text>{upperFirst(t('common.messages.runtime'))}</Text>
        </View>
        <View>
          <Text>{upperFirst(t('common.messages.release_date'))}</Text>
        </View>
      </ScrollView>
    </TrueSheet>
  );
});
FiltersSheet.displayName = 'FiltersSheet';

const SearchTvSeriesScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboardState((state) => state);
  // const navigation = useNavigation();
  const t = useTranslations();
  const search = useSearchStore((state) => state.search);

  // Queries
  const { data, isLoading, isError, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteQuery(
      searchTvSeriesInfiniteOptions({
        filters: {
          q: search,
        },
      }),
    );
  const tvSeries = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  // REFs
  const scrollRef = useRef<LegendListRef>(null);
  // const filtersRef = useRef<TrueSheet>(null);

  // const handleFiltersPress = useCallback(() => {
  // 	filtersRef.current?.present();
  // }, []);

  useScrollToTop(scrollRef);

  // useLayoutEffect(() => {
  // 	navigation.getParent()?.setOptions({
  // 		headerRight: () => <FiltersButton onPress={handleFiltersPress} />
  // 	});

  // 	return () => {
  // 		navigation.getParent()?.setOptions({
  // 			headerRight: undefined,
  // 		});
  // 	};
  // }, [navigation, handleFiltersPress]);

  return (
    <>
      <LegendList
        key={search}
        ref={scrollRef}
        data={tvSeries}
        renderItem={({ item }) => <CardTvSeries variant="list" tvSeries={item} />}
        contentContainerStyle={{
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          paddingBottom: keyboardVisible
            ? keyboardHeight + theme.spaces.md
            : insets.bottom + theme.spaces.md,
          gap: theme.spaces.md,
        }}
        scrollIndicatorInsets={{
          bottom: keyboardVisible ? keyboardHeight - insets.bottom : 0,
        }}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          isError ? (
            <ErrorMessage />
          ) : isLoading ? (
            <Icons.Loader />
          ) : (
            <Text textColor="muted" style={tw`text-center`}>
              {search.length
                ? upperFirst(t('common.messages.no_results'))
                : upperFirst(t('common.messages.start_typing_to_search_tv_series'))}
            </Text>
          )
        }
        keyboardShouldPersistTaps="handled"
        onRefresh={refetch}
        refreshing={isRefetching}
        onEndReached={() => hasNextPage && fetchNextPage()}
      />
      {/* <FiltersSheet ref={filtersRef} /> */}
    </>
  );
};

export default SearchTvSeriesScreen;
