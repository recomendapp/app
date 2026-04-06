import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { Text, useWindowDimensions, View } from "react-native";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { LegendList } from "@legendapp/list";
import { useCallback, useState, useMemo } from "react";
import { Button } from "apps/mobile/src/components/ui/Button";
import { Icons } from "apps/mobile/src/constants/Icons";
import { CardPlaylist } from "apps/mobile/src/components/cards/CardPlaylist";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { movieOptions, moviePlaylistsInfiniteOptions } from "@libs/query-client";
import { PlaylistWithOwner } from "@packages/api-js";

interface sortBy {
	label: string;
	value: 'updated_at' | 'created_at' | 'likes_count';
}

const FilmPlaylists = () => {
	const t = useTranslations();
	const router = useRouter();
	const { width: SCREEN_WIDTH } = useWindowDimensions();
	const { user } = useAuth();
	const { film_id } = useLocalSearchParams<{ film_id: string }>();
	const { id: movieId } = getIdFromSlug(film_id);
	const { colors, bottomOffset, tabBarHeight } = useTheme();
	const { showActionSheetWithOptions } = useActionSheet();
	// States
	const sortByOptions = useMemo((): sortBy[] => [
		{ label: upperFirst(t('common.messages.date_updated')), value: 'updated_at' },
		{ label: upperFirst(t('common.messages.date_created')), value: 'created_at' },
		{ label: upperFirst(t('common.messages.number_of_likes')), value: 'likes_count' },
	], [t]);
	const [sortBy, setSortBy] = useState<sortBy>(sortByOptions[0]);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	// Requests
	const { data: movie } = useQuery(movieOptions({ movieId: movieId }));
	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isRefetching,
		refetch,
	} = useInfiniteQuery(moviePlaylistsInfiniteOptions({
		movieId: movieId,
		filters: {
			sort_by: sortBy.value,
			sort_order: sortOrder,
		}
	}));
	const loading = data === undefined || isLoading;
	const playlists = useMemo(() => data?.pages.flatMap(page => page.data) || [], [data]);
	// Handlers
	const handleSortBy = useCallback(() => {
		const sortByOptionsWithCancel = [
			...sortByOptions,
			{ label: upperFirst(t('common.messages.cancel')), value: 'cancel' },
		];
		const cancelIndex = sortByOptionsWithCancel.length - 1;
		showActionSheetWithOptions({
			options: sortByOptionsWithCancel.map((option) => option.label),
			disabledButtonIndices: sortByOptions ? [sortByOptionsWithCancel.findIndex(option => option.value === sortBy.value)] : [],
			cancelButtonIndex: cancelIndex,
		}, (selectedIndex) => {
			if (selectedIndex === undefined || selectedIndex === cancelIndex) return;
			setSortBy(sortByOptionsWithCancel[selectedIndex] as sortBy);
		});
	}, [sortByOptions, showActionSheetWithOptions, t, sortBy.value]);

	const handleSortOrderToggle = useCallback(() => {
		setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc');
	}, []);

	const renderItem = useCallback(({ item: { owner, ...playlist } } : { item: PlaylistWithOwner }) => (
		<CardPlaylist playlist={playlist} owner={owner} />
	), []);

	return (
	<>
		<Stack.Screen
		options={{
			headerRight: user ? () => (
				<Button
				variant="outline"
				size="icon"
				icon={Icons.AddPlaylist}
				style={tw`rounded-full`}
				onPress={() => {
					router.push({
						pathname: '/playlist/add/[type]/[id]',
						params: {
							type: 'movie',
							id: movieId,
							title: movie?.title,
						},
					})
				}}
				/>
			) : undefined,
			unstable_headerRightItems: user ? (props) => [
				{
					type: "button",
					label: upperFirst(t('common.messages.add_to_playlist')),
					onPress: () => {
						router.push({
							pathname: '/playlist/add/[type]/[id]',
							params: {
								type: 'movie',
								id: movieId,
								title: movie?.title,
							},
						})
					},
					icon: {
						name: "text.badge.plus",
						type: "sfSymbol",
					},
				}
			] : undefined,
		}}
		/>
		<LegendList
		data={playlists}
		renderItem={renderItem}
		ListHeaderComponent={
			<View style={tw.style('flex flex-row justify-end items-center gap-2 py-2')}>
				<Button
				icon={sortOrder === 'desc' ? Icons.ArrowDown : Icons.ArrowUp}
				variant="muted"
				size='icon'
				onPress={handleSortOrderToggle}
				/>
				<Button icon={Icons.ChevronDown} variant="muted" onPress={handleSortBy}>
					{sortBy.label}
				</Button>
			</View>
		}
		ListEmptyComponent={ 
			loading ? <Icons.Loader />
			: (
				<View style={tw`flex-1 items-center justify-center p-4`}>
					<Text style={[tw`text-center`, { color: colors.mutedForeground }]}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			)
		}
		numColumns={
			SCREEN_WIDTH < 360 ? 2 :
			SCREEN_WIDTH < 414 ? 3 :
			SCREEN_WIDTH < 600 ? 4 :
			SCREEN_WIDTH < 768 ? 5 : 6
		}
		onEndReached={useCallback(() => hasNextPage && fetchNextPage(), [hasNextPage, fetchNextPage])}
		onEndReachedThreshold={0.5}
		contentContainerStyle={{
				paddingHorizontal: PADDING_HORIZONTAL,
				paddingBottom: bottomOffset + PADDING_VERTICAL,
				gap: GAP,
		}}
		maintainVisibleContentPosition={false}
		scrollIndicatorInsets={{ bottom: tabBarHeight }}
		keyExtractor={(item) => item.id.toString()}
		refreshing={isRefetching}
		onRefresh={refetch}
		/>
	</>
	);
};

FilmPlaylists.displayName = 'FilmPlaylists';

export default FilmPlaylists;