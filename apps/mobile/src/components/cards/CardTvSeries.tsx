import * as React from "react"
import Animated from "react-native-reanimated";
import { ImageWithFallback } from "../utils/ImageWithFallback";
import { Href, useRouter } from "expo-router";
import tw from "apps/mobile/src/lib/tw";
import { Pressable, View } from "react-native";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { IconMediaRating } from "../medias/IconMediaRating";
import { Skeleton } from "../ui/Skeleton";
import BottomSheetTvSeries from "../bottom-sheets/sheets/BottomSheetTvSeries";
import { Text } from "../ui/text";
import { GAP } from "apps/mobile/src/theme/globals";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";
import { LogTvSeries, LogTvSeriesWithTvSeriesNoReview, TvSeriesCompact, UserSummary } from "@libs/api-js";
import { FixedOmit } from "../../utils/fixed-omit";
import ButtonUserLogTvSeriesWatch from "../buttons/tv-series/ButtonUserLogTvSeriesWatch";

interface CardTvSeriesBaseProps
	extends React.ComponentPropsWithRef<typeof Animated.View> {
		variant?: "default" | "poster" | "list";
		activity?: LogTvSeries;
		profile?: {
			log: Omit<LogTvSeriesWithTvSeriesNoReview, "tvSeries">;
			user: UserSummary;
		}
		href?: Href | null;
		children?: React.ReactNode;
		// Stats
		showRating?: boolean;
		// Actions
		showActionWatch?: boolean;
		onPress?: () => void;
		onLongPress?: () => void;
	}

type CardTvSeriesSkeletonProps = {
	skeleton: true;
	tvSeries?: never;
};

type CardTvSeriesDataProps = {
	skeleton?: false;
	tvSeries: TvSeriesCompact;
};

type VariantBaseProps = Omit<CardTvSeriesBaseProps, "variant"> &
  (CardTvSeriesSkeletonProps | CardTvSeriesDataProps);

type VariantMap = {
	default: VariantBaseProps & {
		variant?: "default"
	};
	poster: VariantBaseProps & {
		variant: "poster"
	};
	list: VariantBaseProps & {
		variant: "list";
		hideReleaseDate?: boolean;
		hideCreator?: boolean;
	};
};

export type CardTvSeriesProps = VariantMap[keyof VariantMap];

const CardTvSeriesDefault = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	FixedOmit<CardTvSeriesProps, "variant" | "linked" | "onPress" | "onLongPress">
>(({ style, tvSeries, skeleton, activity, profile, showActionWatch, children, showRating, ...props }, ref) => {
	const { colors } = useTheme();
	return (
		<Animated.View
		ref={ref}
		style={[
			{ backgroundColor: colors.card, borderColor: colors.border },
			tw`flex-row justify-between items-center rounded-xl h-20 p-1 gap-2 border overflow-hidden`,
			style,
		]}
		{...props}
		>
			<View style={tw`flex-1 flex-row items-center gap-2`}>
				{!skeleton ? <ImageWithFallback
					source={{uri: getTmdbImage({ path: tvSeries.posterPath, size: 'w342' }) ?? ''}}
					alt={tvSeries.name ?? ''}
					type={'tv_series'}
					style={{
						aspectRatio: 2 / 3,
						width: 'auto',
					}}
				/> : <Skeleton style={{ aspectRatio: 2 / 3, width: 'auto' }} />}
				<View style={tw`shrink px-2 py-1 gap-1`}>
					{!skeleton ? <Text numberOfLines={2}>{tvSeries.name}</Text> : <Skeleton style={tw.style('w-full h-5')} />}
					{children}
				</View>
			</View>
			{!skeleton && (
				(showActionWatch || showRating) && (
					<View style={tw`flex-row items-center gap-2`}>
						{showActionWatch && <ButtonUserLogTvSeriesWatch tvSeries={tvSeries} />}
						{showRating && <IconMediaRating rating={activity?.rating} />}
					</View>
				)
			)}
		</Animated.View>
	);
});
CardTvSeriesDefault.displayName = "CardTvSeriesDefault";

const CardTvSeriesPoster = React.forwardRef<
React.ComponentRef<typeof Animated.View>,
	FixedOmit<CardTvSeriesProps, "variant" | "linked" | "onPress" | "onLongPress">
>(({ style, tvSeries, skeleton, activity, profile, showRating, children, ...props }, ref) => {
	return (
		<Animated.View
			ref={ref}
			style={[
				{ aspectRatio: 2 / 3 },
				tw.style('relative flex gap-4 items-center w-32 shrink-0 rounded-sm border-transparent overflow-hidden'),
				style,
			]}
			{...props}
		>
			{!skeleton ? <ImageWithFallback
				source={{uri: getTmdbImage({ path: tvSeries.posterPath, size: 'w342' }) ?? ''}}
				alt={tvSeries.name ?? ''}
				type={'tv_series'}
			/> : <Skeleton style={tw.style('w-full h-full')} />}
			{!skeleton && (tvSeries.voteAverage
			|| profile?.log?.rating
			|| profile?.log?.isLiked
			|| profile?.log?.isReviewed
			) ? (
				<View style={tw`absolute top-1 right-1 flex-col gap-1`}>
					{tvSeries.voteAverage ?
					<IconMediaRating
					rating={tvSeries.voteAverage}
					/> : null}
					{(profile?.log?.isLiked
					|| profile?.log?.rating
					|| profile?.log?.isReviewed) ? (
					<IconMediaRating
					rating={profile?.log?.rating}
					variant="profile"
					/>) : null}
				</View>
			) : null}
		</Animated.View>
	);
});
CardTvSeriesPoster.displayName = "CardTvSeriesPoster";

const CardTvSeriesList = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	FixedOmit<VariantMap["list"], "variant" | "linked" | "onPress" | "onLongPress">
>(({ style, tvSeries, skeleton, activity, profile, showActionWatch, children, showRating, hideReleaseDate, hideCreator, ...props }, ref) => {
	return (
		<Animated.View
		ref={ref}
		style={[
			tw`flex-row justify-between items-center p-1 h-20 gap-2`,
			style,
		]}
		{...props}
		>
			<View style={tw`flex-1 flex-row items-center gap-2`}>
				{!skeleton ? <ImageWithFallback
					source={{uri: getTmdbImage({ path: tvSeries.posterPath, size: 'w342' }) ?? ''}}
					alt={tvSeries.name ?? ''}
					type={'tv_series'}
					style={[
						{
						aspectRatio: 2 / 3,
						width: 'auto',
						}
					]}
				/> : <Skeleton style={{ aspectRatio: 2 / 3, width: 'auto' }} />}
				<View style={tw`shrink px-2 py-1 gap-1`}>
					{!skeleton ? <Text numberOfLines={2}>{tvSeries.name}</Text> : <Skeleton style={tw.style('w-full h-5')} />}
					{!hideCreator && (
						skeleton ? <Skeleton style={tw`w-20 h-5`} /> : tvSeries.createdBy?.length && (
							<Text style={tw`text-sm`} textColor='muted' numberOfLines={1}>
								{tvSeries.createdBy.map((creator) => creator.name).join(', ')}
							</Text>
						)
					)}
					{children}
				</View>
			</View>
			{!hideReleaseDate && (
				<View style={[tw`flex-row items-center`, { gap: GAP }]}>
					{skeleton ? <Skeleton style={tw`h-5 w-12`} /> : tvSeries.firstAirDate && (
						<Text style={tw`text-sm`} textColor='muted' numberOfLines={1}>
							{new Date(tvSeries.firstAirDate).getFullYear()}
						</Text>
					)}
				</View>
			)}
		</Animated.View>
	);
});
CardTvSeriesList.displayName = "CardTvSeriesList";

const CardTvSeries = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	CardTvSeriesProps
>(({ variant = "default", href: hrefProps, onPress, onLongPress, ...props }, ref) => {
	const router = useRouter();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const href: Href | null | undefined = hrefProps || (props.tvSeries ? { pathname: '/tv-series/[tv_series_id]', params: { tv_series_id: props.tvSeries.id }} : undefined);

	const content = (
		variant === "default" ? (
			<CardTvSeriesDefault ref={ref} {...props} />
		) : variant === "poster" ? (
			<CardTvSeriesPoster ref={ref} {...props} />
		) : variant === "list" ? (
			<CardTvSeriesList ref={ref} {...props} />
		) : null
	)

	if (props.skeleton) return content;

	return (
	<Pressable
	onPress={() => {
		if (href) router.push(href);
		onPress?.();
	}}
	onLongPress={() => {
		openSheet(BottomSheetTvSeries, {
			tvSeries: props.tvSeries,
			log: props.profile ? {
				...props.profile.log,
				tvSeries: props.tvSeries,
				user: props.profile.user,
			} : undefined,
		});
		onLongPress?.();
	}}
	>
		{content}
	</Pressable>
	);
});
CardTvSeries.displayName = "CardTvSeries";

export {
	CardTvSeries,
	CardTvSeriesDefault,
	CardTvSeriesPoster,
}