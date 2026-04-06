import { CardTvSeries } from "apps/mobile/src/components/cards/CardTvSeries";
import ErrorMessage from "apps/mobile/src/components/ErrorMessage";
import { Text } from "apps/mobile/src/components/ui/text";
import TrueSheet from "apps/mobile/src/components/ui/TrueSheet";
import { View } from "apps/mobile/src/components/ui/view";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import useSearchStore from "apps/mobile/src/stores/useSearchStore";
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { LegendList, LegendListRef } from "@legendapp/list";
import { TrueSheet as RNTrueSheet } from "@lodev09/react-native-true-sheet";
import { useScrollToTop } from "@react-navigation/native";
// import { useNavigation } from "expo-router";
import { upperFirst } from "lodash";
import { useRef, forwardRef, useMemo } from "react";
import { ScrollView } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { searchTvSeriesInfiniteOptions } from "@libs/query-client";

// const FiltersButton = ({ onPress }: { onPress: () => void }) => {
// 	return (
// 		<View
// 		style={[
// 			tw`flex-row items-center`, 
// 			{ gap: GAP }
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
	const insets = useSafeAreaInsets();
	const t = useTranslations();

	return (
		<TrueSheet
		ref={ref}
		detents={['auto']}
		scrollable
		>
			<ScrollView
				bounces={false}
				contentContainerStyle={{
					paddingTop: PADDING_VERTICAL,
					paddingLeft: insets.left + PADDING_HORIZONTAL,
					paddingRight: insets.right + PADDING_HORIZONTAL,
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
	const insets = useSafeAreaInsets();
	const { bottomOffset, tabBarHeight } = useTheme();
	const {
		isVisible: keyboardVisible,
		height: keyboardHeight,
	} = useKeyboardState((state) => state);
	// const navigation = useNavigation();
	const t = useTranslations();
	const search = useSearchStore(state => state.search);
	
	// Queries
	const {
		data,
		isLoading,
		isError,
		hasNextPage,
		fetchNextPage,
		refetch,
		isRefetching,
	} = useInfiniteQuery(searchTvSeriesInfiniteOptions({
		filters: {
			q: search
		}
	}));
	const tvSeries = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);
	
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
				renderItem={({ item }) => <CardTvSeries variant="list" tvSeries={item} /> }
				contentContainerStyle={{
					paddingLeft: insets.left + PADDING_HORIZONTAL,
					paddingRight: insets.right + PADDING_HORIZONTAL,
					paddingBottom: keyboardVisible ? keyboardHeight + PADDING_VERTICAL : bottomOffset + PADDING_VERTICAL,
					gap: GAP,
				}}
				scrollIndicatorInsets={{
					bottom: keyboardVisible ? (keyboardHeight - insets.bottom) : tabBarHeight,
				}}
				keyExtractor={(item) => item.id.toString()}
				ListEmptyComponent={
					isError ? <ErrorMessage />
					: isLoading ? <Icons.Loader />
					: (
						<View style={tw`flex-1 items-center justify-center`}>
							<Text textColor='muted'>
								{search.length ? upperFirst(t('common.messages.no_results')) : upperFirst(t('common.messages.start_typing_to_search_tv_series'))}
							</Text>
						</View>
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