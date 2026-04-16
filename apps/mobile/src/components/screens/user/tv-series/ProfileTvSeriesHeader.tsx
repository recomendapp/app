import React from 'react';
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
import { Link, useRouter } from 'expo-router';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import tw from 'apps/mobile/src/lib/tw';
import { IconMediaRating } from 'apps/mobile/src/components/medias/IconMediaRating';
import useBottomSheetStore from 'apps/mobile/src/stores/useBottomSheetStore';
import { useTranslations } from 'use-intl';
import { Text } from 'apps/mobile/src/components/ui/text';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from 'apps/mobile/src/theme/globals';
import { useHeaderHeight } from '@react-navigation/elements';
import { useImagePalette } from 'apps/mobile/src/hooks/useImagePalette';
import AnimatedImage from 'apps/mobile/src/components/ui/AnimatedImage';
import { getTmdbImage } from 'apps/mobile/src/lib/tmdb/getTmdbImage';
import { UserTvSeriesWithUserTvSeries } from '@libs/api-js';
import { CardUser } from '../../../cards/CardUser';
import { Icons } from 'apps/mobile/src/constants/Icons';
import BottomSheetTvSeriesFollowersRating from '../../../bottom-sheets/sheets/BottomSheetTvSeriesFollowersRating';

interface ProfileTvSeriesHeaderProps {
	log?: UserTvSeriesWithUserTvSeries | null;
	loading: boolean;
	scrollY: SharedValue<number>;
	triggerHeight: SharedValue<number>;
}
export const ProfileTvSeriesHeader: React.FC<ProfileTvSeriesHeaderProps> = ({
	log,
	loading,
	scrollY,
	triggerHeight,
}) => {
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const t = useTranslations();
	const router = useRouter();
	const { hslToRgb } = useColorConverter();
	const { colors } = useTheme();
	const navigationHeaderHeight = useHeaderHeight();
	const bgColor = hslToRgb(colors.background);
	const { palette } = useImagePalette(getTmdbImage({ path: log?.tvSeries.posterPath, size: 'w92' }) || undefined);
	// SharedValue
	const posterHeight = useSharedValue(0);
	const headerHeight = useSharedValue(0);
	// Animated styles
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
			{log?.tvSeries && (
				log.tvSeries.backdropPath ? (
					<AnimatedImage transition={500} style={tw`absolute inset-0`} source={{ uri: getTmdbImage({ path: log.tvSeries.backdropPath, size: 'w1280' }) ?? '' }} />
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
			tw`flex-row justify-between items-center gap-4`,
			{ paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: PADDING_VERTICAL },
			textAnim
		]}
		>
			<Animated.View style={{ gap: GAP }}>
					<CardUser variant='inline' {...log ? { user: log.user } : { skeleton: true } } />
					{!loading ? (
						<Link disabled={!log?.tvSeriesId} href={{ pathname: '/tv-series/[tv_series_id]', params: { tv_series_id: log?.tvSeriesId! }}} asChild>
							<Text
							variant="title"
							numberOfLines={2}
							style={{
								...tw`text-center`,
								...(!log?.tvSeries && !loading) && { color: colors.mutedForeground }
							}}
							>
								{log?.tvSeries.name || upperFirst(t('common.messages.tv_series_not_found'))}
							</Text>
						</Link>
					) : <Skeleton style={tw`w-64 h-12`} />}
					<View style={tw`flex-row items-center gap-2`}>
						{log?.rating !== null && (
							<IconMediaRating rating={log?.rating} />
						)}
						{log?.isLiked && (
							<Icons.like color={colors.accentPink} fill={colors.accentPink} />
						)}
					</View>
			</Animated.View>
			<Animated.View entering={FadeInDown.delay(200).duration(500)}>
				{!loading ? (
					<Pressable disabled={!log?.tvSeriesId} onPress={() => router.push({ pathname: '/tv-series/[tv_series_id]', params: { tv_series_id: log?.tvSeriesId! } })}>
						<AnimatedImageWithFallback
						onLayout={(e) => {
							'worklet';
							posterHeight.value = e.nativeEvent.layout.height;
						}}
						transition={250}
						alt={log?.tvSeries.name ?? ''}
						source={{ uri: getTmdbImage({ path: log?.tvSeries.posterPath, size: 'w780' }) ?? '' }}
						style={{
							...{ aspectRatio: 2 / 3 },
							...tw`rounded-md w-24 h-auto`,
						}}
						type={'tv_series'}
						/>
					</Pressable>
				) : <Skeleton style={[{ aspectRatio: 2 / 3 }, tw`w-24`]}/>}
			</Animated.View>
		</Animated.View>
	</Animated.View>
	);
};
