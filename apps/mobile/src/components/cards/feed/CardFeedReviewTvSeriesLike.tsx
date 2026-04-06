import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import * as React from "react"
import Animated from "react-native-reanimated";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import { Pressable, View } from "react-native";
import { Href, useRouter } from "expo-router";
import { Text } from "apps/mobile/src/components/ui/text";
import { useTranslations } from "use-intl";
import { Skeleton } from "apps/mobile/src/components/ui/Skeleton";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { CardUser } from "../CardUser";
import { CardReviewTvSeries } from "../reviews/CardReviewTvSeries";
import BottomSheetTvSeries from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetTvSeries";
import { GAP } from "apps/mobile/src/theme/globals";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";
import { FeedItemReviewTvSeriesLike } from "@packages/api-js";
import { FixedOmit } from "apps/mobile/src/utils/fixed-omit";

interface CardFeedReviewTvSeriesLikeBaseProps
	extends React.ComponentProps<typeof Animated.View> {
		variant?: "default";
		onPress?: () => void;
		onLongPress?: () => void;
	}

type CardFeedReviewTvSeriesLikeSkeletonProps = {
	skeleton: true;
	data?: never;
	footer?: never;
};

type CardFeedReviewTvSeriesLikeDataProps = {
	skeleton?: false;
	data: FeedItemReviewTvSeriesLike;
	footer?: React.ReactNode;
};

export type CardFeedReviewTvSeriesLikeProps = CardFeedReviewTvSeriesLikeBaseProps &
	(CardFeedReviewTvSeriesLikeSkeletonProps | CardFeedReviewTvSeriesLikeDataProps);

const CardFeedReviewTvSeriesLikeDefault = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	FixedOmit<CardFeedReviewTvSeriesLikeProps, "variant" | "onPress" | "onLongPress">
>(({ style, children, data, footer, skeleton, ...props }, ref) => {
	const { colors } = useTheme();
	const t = useTranslations();
	return (
		<Animated.View
			ref={ref}
			style={[
				{ gap: GAP * 2 },
				tw`flex-row rounded-xl`,
				style
			]}
			{...props}
		>
			{!skeleton ? (
				<ImageWithFallback
				source={{ uri: getTmdbImage({ path: data.content.tvSeries.posterPath, size: 'w342' }) ?? '' }}
				alt={data.content.tvSeries.name ?? ''}
				type={'tv_series'}
				style={tw`w-20 h-full`}
				/>
			) : (
				<Skeleton style={tw`w-20 h-full`} />
			)}
			<View style={tw`flex-1 gap-2 p-2`}>
				{!skeleton ? <View style={tw`flex-row items-center gap-1`}>
					<CardUser user={data.author} variant="icon" />
					<Text style={[{ color: colors.mutedForeground }, tw`text-sm`]} numberOfLines={2}>
						{t.rich('common.messages.user_liked_review', {
							name: () => (
								<Text style={tw`font-semibold`}>{data.author.name}</Text>
							)
						})}
					</Text>
				</View> : <Skeleton style={tw`w-full h-6`} />}
				<View style={tw`gap-2`}>
					{!skeleton ? (
						<Text numberOfLines={2} style={tw`font-bold`}>
						{data.content.tvSeries.name}
						</Text>
 					) : <Skeleton style={tw`w-full h-5`} />}
					{footer || (
						!skeleton ? (
							<CardReviewTvSeries
							author={data.content.author}
							review={data.content}
							rating={data.content.rating}
							url={{
								pathname: '/user/[username]/tv-series/[tv_series_id]',
								params: {
									username: data.content.author.username,
									tv_series_id: data.content.tvSeries.id,
								}
							}}
							/>
						) : <Skeleton style={tw`w-full h-12`} />
					)}
				</View>
			</View>
		</Animated.View>
	);
});
CardFeedReviewTvSeriesLikeDefault.displayName = "CardFeedReviewTvSeriesLikeDefault";

const CardFeedReviewTvSeriesLike = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	CardFeedReviewTvSeriesLikeProps
>(({ variant = "default", onPress, onLongPress, ...props }, ref) => {
	const router = useRouter();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const handleOnPress = React.useCallback(() => {
		if (!props.data?.content.tvSeries) return;
		router.push({
			pathname: '/tv-series/[tv_series_id]',
			params: { tv_series_id: props.data.content.tvSeries.id }
		});
		onPress?.();
	}, [onPress, props.data?.content.tvSeries, router]);
	const handleOnLongPress = React.useCallback(() => {
		if (!props.data?.content.tvSeries) return;
		openSheet(BottomSheetTvSeries, {
			tvSeries: props.data.content.tvSeries
		})
		onLongPress?.();
	}, [onLongPress, openSheet, props.data?.content.tvSeries]);
	const content = (
		variant === "default" ? (
			<CardFeedReviewTvSeriesLikeDefault ref={ref} {...props} />
		) : null
	);

	if (props.skeleton) return content;

	return (
		<Pressable
		onPress={handleOnPress}
		onLongPress={handleOnLongPress}
		>
			{content}
		</Pressable>
	)
});
CardFeedReviewTvSeriesLike.displayName = "CardFeedReviewTvSeriesLike";

export {
	CardFeedReviewTvSeriesLike,
	CardFeedReviewTvSeriesLikeDefault,
}