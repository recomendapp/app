import { useLocalSearchParams } from "expo-router"
import { upperFirst } from "lodash";
import { LayoutChangeEvent, View } from "react-native";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import { LinearGradient } from 'expo-linear-gradient';
import { Skeleton } from "apps/mobile/src/components/ui/Skeleton";
import { AnimatedImageWithFallback } from "apps/mobile/src/components/ui/AnimatedImageWithFallback";
import { Image } from 'expo-image';
import useColorConverter from "apps/mobile/src/hooks/useColorConverter";
import { useRandomImage } from "apps/mobile/src/hooks/useRandomImage";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { Icons } from "apps/mobile/src/constants/Icons";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import { IconMediaRating } from "apps/mobile/src/components/medias/IconMediaRating";
import { useFormatter, useTranslations } from "use-intl";
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import AnimatedStackScreen from "apps/mobile/src/components/ui/AnimatedStackScreen";
import { useHeaderHeight } from "@react-navigation/elements";
import { useCallback, useMemo } from "react";
import { Text } from "apps/mobile/src/components/ui/text";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { tvSeasonEpisodesInfiniteOptions, tvSeasonOptions } from "@libs/query-client";
import { TvEpisode, TvSeasonGet } from "@libs/api-js";

interface MediaHeaderProps {
	season?: TvSeasonGet;
	episodes?: TvEpisode[];
	loading: boolean;
	scrollY: SharedValue<number>;
	triggerHeight: SharedValue<number>;
}

const TvSeriesSeasonHeader: React.FC<MediaHeaderProps> = ({
	season,
	episodes,
	loading,
	scrollY,
	triggerHeight,
}) => {
	const t = useTranslations();
	const navigationHeaderHeight = useHeaderHeight();
	const { hslToRgb } = useColorConverter();
	const { colors } = useTheme();
	const title = upperFirst(t('common.messages.tv_season_value', { number: season?.seasonNumber! }));
	const bgColor = hslToRgb(colors.background);
	const randomBg = useRandomImage(episodes?.filter(episode => episode.stillPath).map(episode => episode.stillPath!) ?? []);
	// SharedValue
	const posterHeight = useSharedValue(0);
	const headerHeight = useSharedValue(0);

	const textAnim = useAnimatedStyle(() => {
		return {
			opacity: interpolate(
				scrollY.get(),
				[0, (headerHeight.get() - navigationHeaderHeight) / 0.8],
				[1, 0],
				Extrapolation.CLAMP,
			),
			transform: [
				{
					scale: interpolate(
					scrollY.get(),
					[0, (headerHeight.get() - navigationHeaderHeight) / 2],
					[1, 0.98],
					'clamp',
					),
				},
			],
		};
	});
	const bgAnim = useAnimatedStyle(() => {
		const stretch = Math.max(-scrollY.value, 0);
		const base = Math.max(headerHeight.value, 1);
		const scale = 1 + stretch / base;
		const clampedScale = Math.min(scale, 3);

		return {
			transform: [
				{ translateY: -stretch / 2 },
				{ scale: clampedScale },
			],
		};
	});

	return (
	<Animated.View
	onLayout={(event: LayoutChangeEvent) => {
		'worklet';
		const height = event.nativeEvent.layout.height;
		headerHeight.value = height;
		triggerHeight.value = (height - navigationHeaderHeight) * 0.7
	}}
	style={{
		paddingHorizontal: PADDING_HORIZONTAL,
		paddingBottom: PADDING_VERTICAL,
		paddingTop: navigationHeaderHeight,
	}}
	>
		<Animated.View
		style={[
			tw`absolute inset-0`,
			bgAnim,
		]}
		>
			{(season && randomBg) && <Image source={{ uri: getTmdbImage({ path: randomBg, size: 'w1280' }) }} style={tw`absolute inset-0`} />}
			<LinearGradient
			style={tw`absolute inset-0`}
			colors={[
				`rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.3)`,
				`rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.4)`,
				`rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.5)`,
				`rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.6)`,
				`rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.6)`,
				`rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.8)`,
				`rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 1)`,
			]}
			/>
		</Animated.View>
		<Animated.View
		style={[
			tw`flex-row items-center gap-4`,
			textAnim
		]}
		>
			{!loading ? (
				<AnimatedImageWithFallback
				onLayout={(e) => {
					'worklet';
					posterHeight.value = e.nativeEvent.layout.height;
				}}
				alt={title ?? ''}
				source={{ uri: getTmdbImage({ path: season?.posterPath, size: 'w342' }) ?? '' }}
				style={[
					{ aspectRatio: 2 / 3 },
					tw`rounded-md w-24 h-auto`,
				]}
				type={'tv_season'}
				>
					<IconMediaRating
					rating={season?.voteAverage}
					variant="general"
					style={tw`absolute top-1 right-1`}
					/>
				</AnimatedImageWithFallback>
			) : <Skeleton style={[{ aspectRatio: 2 / 3 }, tw`w-24`]}/>}
			<Animated.View
			style={[
				{ gap: GAP },
				tw`w-full`,
			]}
			>
				{season ? <Text>
					<Text style={{ color: colors.accentYellow }}>
						{upperFirst(t(`common.messages.tv_season`, { count: 1 }))}
					</Text>
					{` | ${season.tvSeries?.name}`}
				</Text> : loading ? <Skeleton style={tw`w-32 h-8`} /> : null}
				{/* TITLE */}
				{!loading ? (
					<Text
					numberOfLines={2}
					style={[
						tw`text-4xl font-bold`,
						(!season && !loading) && { textAlign: 'center', color: colors.mutedForeground }
					]}
					>
						{title ?? upperFirst(t('common.messages.media_not_found'))}
					</Text>
				) : <Skeleton style={tw`w-64 h-12`} />}
				{season?.name && (
					<Text numberOfLines={1} style={[ { color: colors.mutedForeground }, tw`text-lg font-semibold`]}>
						{season.name}
					</Text>
				)}
				{season?.episodeCount ? (
					<Text numberOfLines={1}>
						{upperFirst(t('common.messages.tv_episode_count', { count: season.episodeCount }))}
					</Text>
				) : undefined}
			</Animated.View>
		</Animated.View>
	</Animated.View>
	);
};

const TvSeriesSeasonScreen = () => {
	const { tv_series_id, season_number } = useLocalSearchParams<{ tv_series_id: string, season_number: string }>();
	const { id: seriesId } = getIdFromSlug(tv_series_id);
	const { colors, bottomOffset, tabBarHeight } = useTheme();
	const formatter = useFormatter();
	const t = useTranslations();
	const {
		data: season,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery(tvSeasonOptions({
		tvSeriesId: seriesId,
		seasonNumber: Number(season_number),
	}));
	const seasonLoading = useMemo(() => season === undefined || isLoading, [season, isLoading]);
	const {
		data: episodes,
		isLoading: isEpisodesLoading,
		isRefetching: isEpisodesRefetching,
		refetch: refetchEpisodes,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(tvSeasonEpisodesInfiniteOptions({
		tvSeriesId: season?.tvSeriesId,
		seasonNumber: season?.seasonNumber,
	}));
	const episodesLoading = useMemo(() => episodes === undefined || isEpisodesLoading, [episodes, isEpisodesLoading]);
	const flatEpisodes = useMemo(() => episodes?.pages.flatMap(page => page.data) ?? [], [episodes]);
	
	// SharedValue
	const headerHeight = useSharedValue<number>(0);
	const scrollY = useSharedValue<number>(0);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			'worklet';
			scrollY.value = event.contentOffset.y;
		},
	});

	const renderItem = useCallback(({ item }: { item: TvEpisode }) => (
		<Animated.View
		style={[
			{ backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: PADDING_HORIZONTAL },
			tw`flex-row justify-between items-center rounded-xl h-24 gap-2 border overflow-hidden`,
		]}
		>
			<View style={tw`flex-1 flex-row items-center gap-2`}>
				<ImageWithFallback
				source={{uri: getTmdbImage({ path: item.stillPath, size: 'w500' })}}
				alt={item.name ?? ''}
				type={'tv_episode'}
				style={tw`aspect-video w-auto rounded-none`}
				>
					<IconMediaRating
					rating={item.voteAverage}
					variant="general"
					style={tw`absolute top-1 right-1 w-10`}
					/>
				</ImageWithFallback>
				<View style={tw`shrink px-2 py-1 gap-1`}>
					<Text numberOfLines={1}>
						<Text style={{ color: colors.accentYellow }}>
							{upperFirst(t('common.messages.tv_episode_short', { seasonNumber: season?.seasonNumber!, episodeNumber: item.episodeNumber! }))}
						</Text>
						<Text style={tw`font-bold`}>
							{" • "}
							{item.name ?? upperFirst(t('common.messages.tv_episode_value', { number: item.episodeNumber! }))}
						</Text>
					</Text>
					<Text numberOfLines={2}>
						{item.overview ?? upperFirst(t('common.messages.no_overview'))}
					</Text>
					<Text numberOfLines={1} style={[tw`text-sm`, { color: colors.mutedForeground }]}>
						{item.airDate ? formatter.dateTime(new Date(item.airDate), { year: 'numeric', month: 'long', day: 'numeric' }) : upperFirst(t('common.messages.unknown'))}
					</Text>
				</View>
			</View>
		</Animated.View>
	), [colors, season, t, formatter]);

	return (
	<>
		<AnimatedStackScreen
		options={{
			headerTitle: `${season?.tvSeries.name ?? ''} (${upperFirst(t('common.messages.tv_season_short', { number: season?.seasonNumber! }))})`,
		}}
		scrollY={scrollY}
		triggerHeight={headerHeight}
		/>
		<AnimatedLegendList
		data={flatEpisodes}
		renderItem={renderItem}
		onScroll={scrollHandler}
		ListHeaderComponent={
			<TvSeriesSeasonHeader
			season={season}
			episodes={flatEpisodes}
			loading={seasonLoading}
			scrollY={scrollY}
			triggerHeight={headerHeight}
			/>
		}
		ListEmptyComponent={
			episodesLoading ? <Icons.Loader />
			: (
				<View style={[tw`flex-1 items-center justify-center`, { paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: PADDING_VERTICAL }]}>
					<Text style={[tw`text-center`, { color: colors.mutedForeground }]}>
						{upperFirst(t('common.messages.no_tv_episodes'))}
					</Text>
				</View>
			)
		}
		contentContainerStyle={{
			gap: GAP,
			paddingBottom: bottomOffset + PADDING_VERTICAL,
		}}
		scrollIndicatorInsets={{
			bottom: tabBarHeight,
		}}
		keyExtractor={(item) => item.id.toString()}
		refreshing={isRefetching}
		onRefresh={refetch}
		onEndReached={() => hasNextPage && fetchNextPage()}
		/>
	</>
	);
};

export default TvSeriesSeasonScreen;