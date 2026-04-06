import { Href, Link, useLocalSearchParams } from "expo-router"
import { lowerCase, upperFirst } from "lodash";
import { Pressable, useWindowDimensions, View, ViewProps } from "react-native";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { useCallback, useMemo, useState } from "react";
import TvSeriesWidgetSeasons from "apps/mobile/src/components/screens/tv-series/TvSeriesWidgetSeasons";
import { useTranslations } from "use-intl";
import { Text, TextProps } from "apps/mobile/src/components/ui/text";
import AnimatedStackScreen from "apps/mobile/src/components/ui/AnimatedStackScreen";
import { BORDER_RADIUS_FULL, GAP, GAP_XS, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import BottomSheetTvSeries from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetTvSeries";
import TvSeriesHeader from "apps/mobile/src/components/screens/tv-series/TvSeriesHeader";
import TvSeriesWidgetPlaylists from "apps/mobile/src/components/screens/tv-series/TvSeriesWidgetPlaylists";
import TvSeriesWidgetReviews from "apps/mobile/src/components/screens/tv-series/TvSeriesWidgetReviews";
import { Button } from "apps/mobile/src/components/ui/Button";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { FloatingBar } from "apps/mobile/src/components/ui/FloatingBar";
import ButtonUserLogTvSeriesRating from "apps/mobile/src/components/buttons/tv-series/ButtonUserLogTvSeriesRating";
import ButtonUserLogTvSeriesLike from "apps/mobile/src/components/buttons/tv-series/ButtonUserLogTvSeriesLike";
import ButtonUserLogTvSeriesWatch from "apps/mobile/src/components/buttons/tv-series/ButtonUserLogTvSeriesWatch";
import { ButtonPlaylistAdd } from "apps/mobile/src/components/buttons/ButtonPlaylistAdd";
import ButtonUserRecoSend from "apps/mobile/src/components/buttons/ButtonUserRecoSend";
import AnimatedContentContainer from "apps/mobile/src/components/ui/AnimatedContentContainer";
import { Icons } from "apps/mobile/src/constants/Icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { LegendList } from "@legendapp/list";
import { Vimeo } from "react-native-vimeo-iframe";
import TvSeriesWidgetCast from "apps/mobile/src/components/screens/tv-series/TvSeriesWidgetCast";
import { useQuery } from "@tanstack/react-query";
import { tvSeriesCastingOptions, tvSeriesOptions } from "@libs/query-client";
import { TvSeries, TvSeriesTrailer } from "@packages/api-js";
import { ButtonUserBookmark } from "apps/mobile/src/components/buttons/ButtonUserBookmark";

const TvSeriesScreen = () => {
	const { tv_series_id } = useLocalSearchParams<{ tv_series_id: string }>();
	const { id: seriesId } = getIdFromSlug(tv_series_id);
	const { bottomOffset, tabBarHeight } = useTheme();
	const { user } = useAuth();
	const t = useTranslations();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const {
		data: series,
		isLoading,
	} = useQuery(tvSeriesOptions({
		tvSeriesId: seriesId,
	}));
	// Prefetch 
	useQuery(tvSeriesCastingOptions({ tvSeriesId: seriesId }));

	const loading = series === undefined || isLoading;
	
	// SharedValue
	const headerHeight = useSharedValue<number>(0);
	const scrollY = useSharedValue<number>(0);
	const floatingBarHeight = useSharedValue<number>(0);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
			'worklet';
			scrollY.value = event.contentOffset.y;
		},
	});

	const animatedContentContainerStyle = useAnimatedStyle(() => {
		return {
			paddingBottom: withTiming(
				bottomOffset + (PADDING_VERTICAL * 2) + floatingBarHeight.value,
				{ duration: 300 }
			),
		};
	});

	const handleMenuPress = useCallback(() => {
		if (series) {
			openSheet(BottomSheetTvSeries, {
				tvSeries: series,
			});
		}
	}, [series, openSheet]);

	return (
	<>
		<AnimatedStackScreen
		options={{
			headerTitle: series?.name || '',
			headerTransparent: true,
			unstable_headerRightItems: (props) => [
				{
					type: "button",
					label: upperFirst(t('common.messages.menu')),
					onPress: handleMenuPress,
					tintColor: props.tintColor,
					icon: {
						name: "ellipsis",
						type: "sfSymbol",
					},
				},
			],
		}}
		scrollY={scrollY}
		triggerHeight={headerHeight}
		onMenuPress={series ? handleMenuPress : undefined}
		/>
		<AnimatedContentContainer
		onScroll={scrollHandler}
		scrollToOverflowEnabled
		contentContainerStyle={animatedContentContainerStyle}
		scrollIndicatorInsets={{
			bottom: tabBarHeight,
		}}
		>
			<TvSeriesHeader
			tvSeries={series}
			loading={loading}
			scrollY={scrollY}
			triggerHeight={headerHeight}
			/>
			{series && (
				<View style={tw`flex-col gap-4`}>
					{/* DETAILS */}
					<View style={{ gap: GAP  }}>
						<View style={{ gap: GAP_XS }}>
							<TvSeriesSynopsis tvSeries={series} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} />
							<TvSeriesOriginalTitle tvSeries={series} style={{ marginHorizontal: PADDING_HORIZONTAL }} />
						</View>
						<TvSeriesWidgetCast tvSeriesId={series.id} />
						<TvSeriesWidgetSeasons tvSeries={series} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} labelStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} />
						<Link href={{ pathname: '/tv-series/[tv_series_id]/details', params: { tv_series_id: series.id }}} asChild>
							<Button variant="outline" style={{ marginHorizontal: PADDING_HORIZONTAL }}>
								{upperFirst(t('common.messages.see_more_details'))}
							</Button>
						</Link>
					</View>
					<TvSeriesTrailers tvSeries={series} />
					<TvSeriesWidgetPlaylists tvSeriesId={series.id} url={series.url as Href} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} labelStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} />
					<TvSeriesWidgetReviews tvSeries={series} url={series.url as Href} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} labelStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} />
				</View>
			)}
		</AnimatedContentContainer>
		{series && user && (
			<FloatingBar bottomOffset={bottomOffset + PADDING_VERTICAL} height={floatingBarHeight} containerStyle={{ paddingHorizontal: 0 }} style={tw`flex-row items-center justify-between`}>
				<View style={tw`flex-row items-center gap-2`}>
					<ButtonUserLogTvSeriesRating tvSeries={series} />
					<ButtonUserLogTvSeriesLike tvSeries={series} />
					<ButtonUserLogTvSeriesWatch tvSeries={series} />
					<ButtonUserBookmark mediaId={series.id} mediaType="tv_series" mediaTitle={series.name} />
				</View>
				<View style={tw`flex-row items-center gap-2`}>
					<ButtonPlaylistAdd mediaId={series.id} mediaType="tv_series" mediaTitle={series.name} />
					<ButtonUserRecoSend mediaId={series.id} mediaType="tv_series" mediaTitle={series.name} />
				</View>
			</FloatingBar>
		)}
	</>
	)
};

const TvSeriesSynopsis = ({ tvSeries, style, containerStyle, numberOfLines = 5, ...props } : Omit<TextProps, 'children'> & { tvSeries: TvSeries, containerStyle: ViewProps['style'] }) => {
	const t = useTranslations();
	const { colors } = useTheme();
	const [showFullSynopsis, setShowFullSynopsis] = useState<boolean>(false);

	const toggleSynopsis = useCallback(() => {
		setShowFullSynopsis((prev) => !prev);
	}, []);

	if (!tvSeries.overview || tvSeries.overview.length === 0) return null;
	return (
		<Pressable
		style={[containerStyle]}
		onPress={toggleSynopsis}
		>
			<Text style={[tw`text-sm`, { color: colors.mutedForeground }, style]} numberOfLines={showFullSynopsis ? undefined : numberOfLines} ellipsizeMode="tail" {...props}>
				<Text style={tw`text-sm font-medium`}>
					{`${upperFirst(t('common.messages.overview'))} : `}
				</Text>
				{tvSeries.overview}
			</Text>
		</Pressable>
	)
};

const TvSeriesOriginalTitle = ({ tvSeries, style, numberOfLines = 1, ...props } : Omit<TextProps, 'children'> & { tvSeries: TvSeries }) => {
	const t = useTranslations();
	const { colors } = useTheme();

	if (!tvSeries.originalName || lowerCase(tvSeries.originalName) === lowerCase(tvSeries.name!)) return null;
	return (
		<Text style={[tw`text-sm`, { color: colors.mutedForeground }, style]} numberOfLines={numberOfLines} {...props}>
			<Text style={tw`text-sm font-medium`}>
				{`${upperFirst(t('common.messages.original_title'))} : `}
			</Text>
			{tvSeries.originalName}
		</Text>
	)
};

const TvSeriesTrailers = ({
	tvSeries,
} : {
	tvSeries: TvSeries
}) => {
	const { colors } = useTheme();
	const t = useTranslations();
	// UI
	const { width } = useWindowDimensions();
	const playerWidth = width - PADDING_HORIZONTAL * 2;
	const playerHeight = playerWidth * 9 / 16;
	// States
	const [selectedTrailer, setSelectedTrailer] = useState<TvSeriesTrailer | null>(tvSeries.trailers?.at(0) || null);
	const normalizedSite = useMemo(() => selectedTrailer?.site.toLowerCase(), [selectedTrailer]);
	// Render
	const renderItem = useCallback(({ item }: { item: TvSeriesTrailer }) => {
		const label = item.iso6391 === tvSeries.originalLanguage ? 'VO' : (item.iso6391?.toUpperCase() || 'N/A');
		return (
			<Button variant={item.id === selectedTrailer?.id ? 'accent-yellow' : 'outline'} onPress={() => setSelectedTrailer(item)} style={{ borderRadius: BORDER_RADIUS_FULL }}>
				{label}
			</Button>
		)
	}, [selectedTrailer, tvSeries.originalLanguage]);
	if (!tvSeries.trailers?.length || !selectedTrailer) return null;
	return (
		<View style={{ gap: GAP }}> 
			<View style={[tw`flex-row items-center`, { gap: GAP, marginHorizontal: PADDING_HORIZONTAL }]}>
				<Icons.PlayCircle color={colors.foreground} />
				<Text style={tw`text-lg font-medium`}>
					{upperFirst(t('common.messages.trailer', { count: 2 }))}
				</Text>
			</View>
			<View style={{ marginHorizontal: PADDING_HORIZONTAL }}>

				{
					normalizedSite === 'youtube' ? (
						<YoutubePlayer
						height={playerHeight}
						videoId={selectedTrailer.key}
						/>
					) : normalizedSite === 'vimeo' ? (
						<Vimeo
						videoId={selectedTrailer.key}
						params={'api=1&controls=1'}
						style={{ width: '100%', aspectRatio: 16 / 9 }}
						/>
					) : (
						<View style={[tw`items-center justify-center`, { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.muted }]}>
							<Text style={{ color: colors.mutedForeground }}>
								{upperFirst(t('common.messages.trailer', { count: 1 }))} not supported.
							</Text>
						</View>
					)
				}
			</View>
			<LegendList
			data={tvSeries.trailers || []}
			extraData={selectedTrailer}
			renderItem={renderItem}
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, gap: GAP }}
			/>
		</View>
	)
};

export default TvSeriesScreen;