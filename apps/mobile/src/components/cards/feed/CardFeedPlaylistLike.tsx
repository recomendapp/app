import * as React from "react"
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import Animated from "react-native-reanimated";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "apps/mobile/src/components/ui/text";
import { useTranslations } from "use-intl";
import { Skeleton } from "apps/mobile/src/components/ui/Skeleton";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import BottomSheetPlaylist from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetPlaylist";
import { CardUser } from "../CardUser";
import { GAP } from "apps/mobile/src/theme/globals";
import { FeedItemPlaylistLike } from "@packages/api-js";
import { FixedOmit } from "apps/mobile/src/utils/fixed-omit";

interface CardFeedPlaylistLikeBaseProps
	extends React.ComponentProps<typeof Animated.View> {
		variant?: "default";
		onPress?: () => void;
		onLongPress?: () => void;
	}

type CardFeedPlaylistLikeSkeletonProps = {
	skeleton: true;
	data?: never;
	footer?: never;
};

type CardFeedPlaylistLikeDataProps = {
	skeleton?: false;
	data: FeedItemPlaylistLike;
	footer?: React.ReactNode;
};

export type CardFeedPlaylistLikeProps = CardFeedPlaylistLikeBaseProps &
	(CardFeedPlaylistLikeSkeletonProps | CardFeedPlaylistLikeDataProps);

const CardFeedPlaylistLikeDefault = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	FixedOmit<CardFeedPlaylistLikeProps, "variant" | "onPress" | "onLongPress">
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
				source={{ uri: data.content.poster ?? '' }}
				alt={data.content.title ?? ''}
				type={'playlist'}
				style={tw`w-20 min-h-20 h-full`}
				/>
			) : (
				<Skeleton style={tw`w-20 aspect-square h-full`} />
			)}
			<View style={tw`flex-1 gap-2 p-2`}>
				{!skeleton ? <View style={tw`flex-row gap-1`}>
					<CardUser user={data.author} variant="icon" />
					<Text style={[{ color: colors.mutedForeground }, tw`text-sm`]} numberOfLines={2}>
						{t.rich('common.messages.user_liked_playlist', {
							name: () => (
								<Text style={tw`font-semibold`}>{data.author.name}</Text>
							)
						})}
					</Text>
				</View> : <Skeleton style={tw`w-full h-6`} />}
				<View style={tw`gap-2`}>
					{!skeleton ? (
						<Text numberOfLines={2} style={tw`font-bold`}>
						{data.content.title}
						</Text>
 					) : <Skeleton style={tw`w-full h-5`} />}
					{footer || (
						!skeleton ? (
							data.content.description && (
								<Text
								numberOfLines={2}
								style={tw`text-xs text-justify`}
								>
									{data.content.description}
								</Text>
							)
						) : <Skeleton style={tw`w-full h-12`} />
					)}
				</View>
			</View>
		</Animated.View>
	);
});
CardFeedPlaylistLikeDefault.displayName = "CardFeedPlaylistLikeDefault";

const CardFeedPlaylistLike = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	CardFeedPlaylistLikeProps
>(({ variant = "default", onPress, onLongPress, ...props }, ref) => {
	const router = useRouter();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const handleOnPress = React.useCallback(() => {
		if (!props.data) return;
		router.push({
			pathname: '/playlist/[playlist_id]',
			params: { playlist_id: props.data.content.id }
		});
		onPress?.();
	}, [onPress, props.data, router]);
	const handleOnLongPress = React.useCallback(() => {
		if (!props.data) return;
		openSheet(BottomSheetPlaylist, {
			playlist: props.data.content!
		})
		onLongPress?.();
	}, [onLongPress, openSheet, props.data]);
	const content = (
		variant === "default" ? (
			<CardFeedPlaylistLikeDefault ref={ref} {...props} />
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
CardFeedPlaylistLike.displayName = "CardFeedPlaylistLike";

export {
	CardFeedPlaylistLike,
	CardFeedPlaylistLikeDefault,
}