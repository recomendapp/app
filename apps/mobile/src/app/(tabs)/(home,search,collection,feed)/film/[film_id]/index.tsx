import { Href, Link, useLocalSearchParams } from "expo-router"
import { lowerCase, upperFirst } from "lodash";
import { Pressable, useWindowDimensions, ViewProps } from "react-native";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getIdFromSlug } from "apps/mobile/src/utils/getIdFromSlug";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "use-intl";
import { Text, TextProps } from "apps/mobile/src/components/ui/text";
import AnimatedStackScreen from "apps/mobile/src/components/ui/AnimatedStackScreen";
import { BORDER_RADIUS_FULL, GAP, GAP_XS, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import MovieHeader from "apps/mobile/src/components/screens/film/MovieHeader";
import BottomSheetMovie from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetMovie";
import MovieWidgetReviews from "apps/mobile/src/components/screens/film/MovieWidgetReviews";
import MovieWidgetPlaylists from "apps/mobile/src/components/screens/film/MovieWidgetPlaylists";
import { View } from "apps/mobile/src/components/ui/view";
import { Button } from "apps/mobile/src/components/ui/Button";
import { FloatingBar } from "apps/mobile/src/components/ui/FloatingBar";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import ButtonUserLogMovieRating from "apps/mobile/src/components/buttons/movies/ButtonUserLogMovieRating";
import ButtonUserLogMovieLike from "apps/mobile/src/components/buttons/movies/ButtonUserLogMovieLike";
import ButtonUserLogMovieWatch from "apps/mobile/src/components/buttons/movies/ButtonUserLogMovieWatch";
import ButtonUserLogMovieWatchDate from "apps/mobile/src/components/buttons/movies/ButtonUserLogMovieWatchDate";
import { ButtonPlaylistAdd } from "apps/mobile/src/components/buttons/ButtonPlaylistAdd";
import ButtonUserRecoSend from "apps/mobile/src/components/buttons/ButtonUserRecoSend";
import AnimatedContentContainer from "apps/mobile/src/components/ui/AnimatedContentContainer";
import { Icons } from "apps/mobile/src/constants/Icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { Vimeo } from 'react-native-vimeo-iframe'
import { LegendList } from "@legendapp/list/react-native";
import MovieWidgetCast from "apps/mobile/src/components/screens/film/MovieWidgetCast";
import { useQuery } from "@tanstack/react-query";
import { movieCastingOptions, movieOptions } from "@libs/query-client";
import { Movie, MovieTrailer } from "@libs/api-js";
import { ButtonUserBookmark } from "apps/mobile/src/components/buttons/ButtonUserBookmark";

const FilmScreen = () => {
	const { film_id } = useLocalSearchParams<{ film_id: string }>();
	const { id: movieId } = getIdFromSlug(film_id);
	const { user } = useAuth();
	const { bottomOffset, tabBarHeight } = useTheme();
	const t = useTranslations();
	const openSheet = useBottomSheetStore((state) => state.openSheet);

	const {
		data: movie,
		isLoading,
	} = useQuery(movieOptions({
		movieId: movieId,
	}));

	// Prefetch related data
	useQuery(movieCastingOptions({ movieId: movieId }));

	const loading = movie === undefined || isLoading;

	// SharedValue
	const headerHeight = useSharedValue<number>(0);
	const scrollY = useSharedValue<number>(0);
	const floatingBarHeight = useSharedValue<number>(0);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: event => {
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
		if (movie) {
			openSheet(BottomSheetMovie, {
				movie: movie,
			});
		}
	}, [movie, openSheet]);

	return (
	<>
		<AnimatedStackScreen
		options={{
			headerTitle: movie?.title || '',
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
		onMenuPress={movie ? handleMenuPress : undefined}
		/>
		<AnimatedContentContainer
		onScroll={scrollHandler}
		scrollToOverflowEnabled
		contentContainerStyle={animatedContentContainerStyle}
		scrollIndicatorInsets={{
			bottom: tabBarHeight,
		}}
		>
			<MovieHeader
			movie={movie}
			loading={loading}
			scrollY={scrollY}
			triggerHeight={headerHeight}
			/>
			{movie && (
				<View style={tw`flex-col gap-4`}>
					{/* DETAILS */}
					<View style={{ gap: GAP  }}>
						<View style={{ gap: GAP_XS }}>
							<FilmSynopsis movie={movie} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} />
							<FilmOriginalTitle movie={movie} style={{ marginHorizontal: PADDING_HORIZONTAL }} />
						</View>
						<MovieWidgetCast movieId={movie.id} />
						<Link href={{ pathname: '/film/[film_id]/details', params: { film_id: movie.id }}} asChild>
							<Button variant="outline" style={{ marginHorizontal: PADDING_HORIZONTAL }}>
								{upperFirst(t('common.messages.see_more_details'))}
							</Button>
						</Link>
					</View>
					<FilmTrailers movie={movie} />
					<MovieWidgetPlaylists movieId={movie.id!} url={movie.url as Href} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} labelStyle={{ paddingHorizontal: PADDING_HORIZONTAL }}/>
					<MovieWidgetReviews movie={movie} url={movie.url as Href} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }} labelStyle={{ paddingHorizontal: PADDING_HORIZONTAL }}/>
				</View>
			)}
		</AnimatedContentContainer>
		{movie && user && (
			<FloatingBar bottomOffset={bottomOffset + PADDING_VERTICAL} height={floatingBarHeight} containerStyle={{ paddingHorizontal: 0 }} style={tw`flex-row items-center justify-between`}>
				<View style={tw`flex-row items-center gap-2`}>
					<ButtonUserLogMovieRating movie={movie} />
					<ButtonUserLogMovieLike movie={movie} />
					<ButtonUserLogMovieWatch movie={movie} />
					<ButtonUserBookmark mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
					<ButtonUserLogMovieWatchDate movie={movie} />
				</View>
				<View style={tw`flex-row items-center gap-2`}>
					<ButtonPlaylistAdd mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
					<ButtonUserRecoSend mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
				</View>
			</FloatingBar>
		)}
	</>
	)
};

const FilmSynopsis = ({ movie, style, containerStyle, numberOfLines = 5, ...props } : Omit<TextProps, 'children'> & { movie: Movie, containerStyle: ViewProps['style'] }) => {
	const t = useTranslations();
	const { colors } = useTheme();
	const [showFullSynopsis, setShowFullSynopsis] = useState<boolean>(false);

	const toggleSynopsis = useCallback(() => {
		setShowFullSynopsis((prev) => !prev);
	}, []);

	if (!movie.overview || movie.overview.length === 0) return null;
	return (
		<Pressable
		style={[containerStyle]}
		onPress={toggleSynopsis}
		>
			<Text style={[tw`text-sm`, { color: colors.mutedForeground }, style]} numberOfLines={showFullSynopsis ? undefined : numberOfLines} ellipsizeMode="tail" {...props}>
				<Text style={tw`text-sm font-medium`}>
					{`${upperFirst(t('common.messages.overview'))} : `}
				</Text>
				{movie.overview}
			</Text>
		</Pressable>
	)
};

const FilmOriginalTitle = ({ movie, style, numberOfLines = 1, ...props } : Omit<TextProps, 'children'> & { movie: Movie }) => {
	const t = useTranslations();
	const { colors } = useTheme();

	if (!movie.originalTitle || lowerCase(movie.originalTitle) === lowerCase(movie.title!)) return null;

	return (
		<Text style={[tw`text-sm`, { color: colors.mutedForeground }, style]} numberOfLines={numberOfLines} {...props}>
			<Text style={tw`text-sm font-medium`}>
				{`${upperFirst(t('common.messages.original_title'))} : `}
			</Text>
			{movie.originalTitle}
		</Text>
	)
};

const FilmTrailers = ({
	movie,
} : {
	movie: Movie;
}) => {
	const { colors } = useTheme();
	const t = useTranslations();
	// UI
	const { width } = useWindowDimensions();
	const playerWidth = width - PADDING_HORIZONTAL * 2;
	const playerHeight = playerWidth * 9 / 16;
	// States
	const [selectedTrailer, setSelectedTrailer] = useState<MovieTrailer | null>(movie.trailers?.at(0) || null);
	const normalizedSite = useMemo(() => selectedTrailer?.site.toLowerCase(), [selectedTrailer]);
	// Render
	const renderItem = useCallback(({ item }: { item: MovieTrailer }) => {
		const label = item.iso6391 === movie.originalLanguage ? 'VO' : (item.iso6391?.toUpperCase() || 'N/A');
		return (
			<Button variant={item.id === selectedTrailer?.id ? 'accent-yellow' : 'outline'} onPress={() => setSelectedTrailer(item)} style={{ borderRadius: BORDER_RADIUS_FULL }}>
				{label}
			</Button>
		)
	}, [selectedTrailer, movie.originalLanguage]);
	if (!movie.trailers?.length || !selectedTrailer) return null;
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
			data={movie.trailers}
			extraData={selectedTrailer}
			renderItem={renderItem}
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, gap: GAP }}
			/>
		</View>
	)
};

export default FilmScreen;