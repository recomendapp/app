import { CardMovie } from '../../../../../components/cards/CardMovie';
import { Text } from '../../../../../components/ui/text';
import TrueSheet from '../../../../../components/ui/TrueSheet';
import { TrueSheet as RNTrueSheet } from '@lodev09/react-native-true-sheet';
import { View } from '../../../../../components/ui/view';
import { Icons } from '../../../../../constants/Icons';
import tw from '../../../../../lib/tw';
import useSearchStore from '../../../../../stores/useSearchStore';
import { LegendList, LegendListRef } from '@legendapp/list/react-native';
import { useScrollToTop } from 'expo-router/react-navigation';
import { upperFirst } from 'lodash';
import { useRef, forwardRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import ErrorMessage from '../../../../../components/ErrorMessage';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchMoviesInfiniteOptions } from '@libs/query-client';
import { useTheme } from '../../../../../providers/ThemeProvider';

const FiltersSheet = forwardRef<RNTrueSheet>((_, ref) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations();

  const scrollableRef = useRef<ScrollView>(null);

  return (
    <TrueSheet ref={ref} detents={['auto']} scrollableRef={scrollableRef}>
      <ScrollView
        ref={scrollableRef}
        bounces={false}
        contentContainerStyle={{
          paddingTop: theme.spaces.md,
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          backgroundColor: 'red', // TODO: Remove debug style
        }}
      >
        <Text>Filters MOVIES</Text>
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

const SearchFilmsScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboardState((state) => state);
  // const navigation = useNavigation();
  const t = useTranslations();
  const search = useSearchStore((state) => state.search);

  // States
  // const [runtimeFilter, setRuntimeFilter] = useState<{ min?: number; max?: number }>({
  // 	min: undefined,
  // 	max: undefined
  // });

  // Queries
  const { data, isLoading, isError, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteQuery(
      searchMoviesInfiniteOptions({
        filters: {
          q: search,
        },
      }),
    );
  const movies = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  // REFs
  const scrollRef = useRef<LegendListRef>(null);
  // const filtersRef = useRef<TrueSheet>(null);

  // const handleFiltersPress = () => {
  // 	filtersRef.current?.present();
  // };

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
        data={movies}
        renderItem={({ item }) => <CardMovie variant="list" movie={item} />}
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
                : upperFirst(t('common.messages.start_typing_to_search_films'))}
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
SearchFilmsScreen.displayName = 'SearchFilmsScreen';

export default SearchFilmsScreen;
