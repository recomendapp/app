import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import * as React from "react"
import Animated from "react-native-reanimated";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import { Pressable, View } from "react-native";
import FeedUserLog from "apps/mobile/src/components/screens/feed/FeedUserLog";
import { useRouter } from "expo-router";
import { Text } from "apps/mobile/src/components/ui/text";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { Skeleton } from "apps/mobile/src/components/ui/Skeleton";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import BottomSheetMovie from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetMovie";
import { CardUser } from "../CardUser";
import { CardReviewMovie } from "../reviews/CardReviewMovie";
import { GAP } from "apps/mobile/src/theme/globals";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";
import { FeedItemLogMovie } from "@libs/api-js";
import { FixedOmit } from "apps/mobile/src/utils/fixed-omit";

interface CardFeedLogMovieBaseProps
	extends React.ComponentProps<typeof Animated.View> {
		variant?: "default";
		onPress?: () => void;
		onLongPress?: () => void;
	}

type CardFeedLogMovieSkeletonProps = {
	skeleton: true;
	data?: never;
	footer?: never;
};

type CardFeedLogMovieDataProps = {
	skeleton?: false;
	data: FeedItemLogMovie;
	footer?: React.ReactNode;
};

export type CardFeedLogMovieProps = CardFeedLogMovieBaseProps &
	(CardFeedLogMovieSkeletonProps | CardFeedLogMovieDataProps);

const CardFeedLogMovieDefault = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	FixedOmit<CardFeedLogMovieProps, "variant" | "onPress" | "onLongPress">
>(({ style, children, data, footer, skeleton, ...props }, ref) => {
	const { colors } = useTheme();
	const t = useTranslations();
	return (
		<Animated.View
			ref={ref}
			style={[
				{ gap: GAP },
				tw`flex-row rounded-xl`,
				style
			]}
			{...props}
		>
			{!skeleton ? (
				<ImageWithFallback
				source={{ uri: getTmdbImage({ path: data.content.movie.posterPath, size: 'w342' }) ?? '' }}
				alt={data.content.movie.title ?? ''}
				type={'movie'}
				style={tw`w-20 h-full`}
				/>
			) : (
				<Skeleton style={tw`w-20 h-full`} />
			)}
			<View style={tw`flex-1 gap-2 p-2`}>
				{!skeleton ? <View style={tw`flex-row items-center gap-1`}>
					<CardUser user={data.author} variant="icon" />
					<FeedUserLog author={data.author} log={data.content} style={[{ color: colors.mutedForeground }, tw`text-sm`]} />
				</View> : <Skeleton style={tw`w-full h-6`} />}
				<View style={tw`gap-2`}>
					{!skeleton ? (
						<Text numberOfLines={2} style={tw`font-bold`}>
						{data.content.movie.title}
						</Text>
 					) : <Skeleton style={tw`w-full h-5`} />}
					{footer || (
						skeleton
							? <Skeleton style={tw`w-full h-12`} />
							: data.content.review ? (
								<CardReviewMovie
								author={data.author}
								review={data.content.review}
								rating={data.content.rating}
								url={{
									pathname: '/user/[username]/film/[film_id]',
									params: {
										username: data.author.username,
										film_id: data.content.movieId,
									}
								}}
								/>
							) : (
								<Text
								textColor={!data.content.movie.overview ? "muted" : undefined}
								numberOfLines={2}
								style={tw`text-xs text-justify`}
								>
									{data.content.movie.overview || upperFirst(t('common.messages.no_description'))}
								</Text>
							)
					)}
				</View>
			</View>
		</Animated.View>
	);
});
CardFeedLogMovieDefault.displayName = "CardFeedLogMovieDefault";

const CardFeedLogMovie = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	CardFeedLogMovieProps
>(({ variant = "default", onPress, onLongPress, ...props }, ref) => {
	const router = useRouter();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const handleOnPress = React.useCallback(() => {
		if (!props.data?.content.movie) return;
		router.push({
			pathname: '/film/[film_id]',
			params: {
				film_id: props.data.content.movieId,
			},
		});
		onPress?.();
	}, [onPress, props.data?.content.movie, router]);
	const handleOnLongPress = React.useCallback(() => {
		if (!props.data?.content.movie) return;
		openSheet(BottomSheetMovie, {
			movie: props.data.content.movie
		})
		onLongPress?.();
	}, [onLongPress, openSheet, props.data?.content.movie]);
	const content = (
		variant === "default" ? (
			<CardFeedLogMovieDefault ref={ref} {...props} />
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
CardFeedLogMovie.displayName = "CardFeedLogMovie";

export {
	CardFeedLogMovie,
	CardFeedLogMovieDefault,
}