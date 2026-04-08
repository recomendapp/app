import React, { useCallback } from 'react';
import {
	LayoutChangeEvent,
	Pressable,
	View,
} from 'react-native';
import Animated, {
	Extrapolation,
	FadeIn,
	FadeInDown,
	interpolate,
	SharedValue,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';
import { AnimatedImageWithFallback } from 'apps/mobile/src/components/ui/AnimatedImageWithFallback';
import { upperFirst } from 'lodash';
import useColorConverter from 'apps/mobile/src/hooks/useColorConverter';
import { Skeleton } from 'apps/mobile/src/components/ui/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import tw from 'apps/mobile/src/lib/tw';
import { IconMediaRating } from 'apps/mobile/src/components/medias/IconMediaRating';
import useBottomSheetStore from 'apps/mobile/src/stores/useBottomSheetStore';
import { useLocale, useTranslations } from 'use-intl';
import { Text, TextProps } from 'apps/mobile/src/components/ui/text';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from 'apps/mobile/src/theme/globals';
import BottomSheetMovieFollowersRating from 'apps/mobile/src/components/bottom-sheets/sheets/BottomSheetMovieFollowersRating';
import { useHeaderHeight } from '@react-navigation/elements';
import { MovieHeaderInfo } from './MovieHeaderInfo';
import { useImagePalette } from 'apps/mobile/src/hooks/useImagePalette';
import AnimatedImage from 'apps/mobile/src/components/ui/AnimatedImage';
import BottomSheetPerson from 'apps/mobile/src/components/bottom-sheets/sheets/BottomSheetPerson';
import { getTmdbImage } from 'apps/mobile/src/lib/tmdb/getTmdbImage';
import { Movie, PersonCompact } from '@libs/api-js';

interface MovieHeaderProps {
	movie?: Movie | null;
	loading: boolean;
	scrollY: SharedValue<number>;
	triggerHeight: SharedValue<number>;
}
const MovieHeader: React.FC<MovieHeaderProps> = ({
	movie,
	loading,
	scrollY,
	triggerHeight,
}) => {
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const t = useTranslations();
	const { hslToRgb } = useColorConverter();
	const { colors } = useTheme();
	const navigationHeaderHeight = useHeaderHeight();
	const bgColor = hslToRgb(colors.background);
	const { palette } = useImagePalette(getTmdbImage({ path: movie?.posterPath, size: 'w92' }) || undefined);
	// SharedValue
	const posterHeight = useSharedValue(0);
	const headerHeight = useSharedValue(0);
	// Animated styles
	const posterAnim = useAnimatedStyle(() => {
		const stretch = Math.max(-scrollY.value, 0);
		const base = Math.max(posterHeight.value, 1);
		const scale = 1 + stretch / base;
		const clampedScale = Math.min(scale, 3);
		const translateY = -stretch / 2;
		return {
			transform: [
				{ translateY },
				{ scale: clampedScale },
			],
		};
	});
	const textAnim = useAnimatedStyle(() => {
		return {
			opacity: interpolate(
				scrollY.get(),
				[0, headerHeight.get() - navigationHeaderHeight / 0.8],
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
	style={[
		tw`w-full`,
		{ paddingTop: navigationHeaderHeight }
	]}
	onLayout={(event: LayoutChangeEvent) => {
		'worklet';
		const height = event.nativeEvent.layout.height;
		headerHeight.value = height;
		triggerHeight.value = (height - navigationHeaderHeight) * 0.7;
	}}
	>
		<Animated.View
		style={[
			tw`absolute inset-0`,
			bgAnim,
		]}
		>
			{movie && (
				movie.backdropPath ? (
					<AnimatedImage transition={500} style={tw`absolute inset-0`} source={{ uri: getTmdbImage({ path: movie.backdropPath, size: 'w1280' }) ?? '' }} />
				) : (palette && palette.length > 1 ) && (
					<Animated.View entering={FadeIn} style={[tw`absolute inset-0`, { backgroundColor: palette.at(0) }]} />
				)
			)}
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
			tw`items-center gap-4`,
			{ paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: PADDING_VERTICAL }
		]}
		>
			<Animated.View entering={FadeInDown.delay(200).duration(500)}>
				{!loading ? (
					<AnimatedImageWithFallback
					onLayout={(e) => {
						'worklet';
						posterHeight.value = e.nativeEvent.layout.height;
					}}
					transition={250}
					alt={movie?.title ?? ''}
					source={{ uri: getTmdbImage({ path: movie?.posterPath, size: 'w780' }) ?? '' }}
					style={[
						{ aspectRatio: 2 / 3 },
						tw`rounded-md w-48 h-auto`,
						posterAnim
					]}
					type={'movie'}
					>
						<View style={tw`absolute gap-2 top-2 right-2`}>
							{movie?.voteAverage ? (
								<IconMediaRating
								rating={movie.voteAverage}
								variant="general"
								/>
							) : null}
							{movie?.followerAvgRating && (
								<Pressable onPress={() => openSheet(BottomSheetMovieFollowersRating, { movieId: movie.id })}>
									<IconMediaRating
									rating={movie.followerAvgRating}
									variant="follower"
									/>
								</Pressable>
							)}
						</View>
					</AnimatedImageWithFallback>
				) : <Skeleton style={[{ aspectRatio: 2 / 3 }, tw`w-48`, posterAnim]}/>}
			</Animated.View>
			<Animated.View
			style={[
				tw`w-full items-center`,
				{ gap: GAP },
				textAnim
			]}
			>
				<View>
					{!loading ? (
						<Text
						variant="title"
						numberOfLines={2}
						style={[
							tw`text-center`,
							(!movie && !loading) && { color: colors.mutedForeground }
						]}
						>
							{movie?.title || upperFirst(t('common.messages.film_not_found'))}
						</Text>
					) : <Skeleton style={tw`w-64 h-12`} />}
					{movie?.directors?.length ? (
						<Directors style={tw`text-center`} directors={movie.directors} />
					) : null}
				</View>

				{movie ? <MovieHeaderInfo movie={movie} /> : loading ? <Skeleton style={tw`w-32 h-8`} /> : null}
			</Animated.View>
		</Animated.View>
	</Animated.View>
	);
};

const Directors = ({ directors, ...props }: Omit<TextProps, 'children'> & { directors: PersonCompact[] }) => {
	const router = useRouter();
	const locale = useLocale();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const listFormatter = new Intl.ListFormat(locale, {
		style: 'long',
		type: 'conjunction',
	});
	const names = directors.map(d => d.name!);
	const formatted = listFormatter.formatToParts(names);

	const onPress = useCallback((person: PersonCompact) => {
		router.push({ pathname: '/person/[person_id]', params: { person_id: person.slug || person.id }})
	}, [router]);
	const onLongPress = useCallback((person: PersonCompact) => {
		openSheet(BottomSheetPerson, {
			person: person,
		});
	}, [openSheet]);
	return (
		<Text {...props}>
		{formatted.map((part, i) => {
			const director = directors.find(d => d.name === part.value);
			if (part.type === 'element') {
				return (
					<Text key={i} onPress={() => onPress(director!)} onLongPress={() => onLongPress(director!)}>
					{director?.name}
					</Text>
				);
			}
			return part.value;
		})}
		</Text>
	);
};
export default MovieHeader;