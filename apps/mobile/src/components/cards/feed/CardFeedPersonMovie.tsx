import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import * as React from "react"
import Animated from "react-native-reanimated";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import { Pressable, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Text } from "apps/mobile/src/components/ui/text";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import UserAvatar from "apps/mobile/src/components/user/UserAvatar";
import { Skeleton } from "apps/mobile/src/components/ui/Skeleton";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import BottomSheetMovie from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetMovie";
import { BadgeMedia } from "apps/mobile/src/components/badges/BadgeMedia";
import { GAP } from "apps/mobile/src/theme/globals";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";
import { PersonFeedWithMovie } from "@packages/api-js";
import { FixedOmit } from "apps/mobile/src/utils/fixed-omit";

interface CardFeedPersonMovieBaseProps
	extends React.ComponentProps<typeof Animated.View> {
		variant?: "default";
		onPress?: () => void;
		onLongPress?: () => void;
	}

type CardFeedPersonMovieSkeletonProps = {
	skeleton: true;
	data?: never;
};

type CardFeedPersonMovieDataProps = {
	skeleton?: false;
	data: PersonFeedWithMovie;
};

export type CardFeedPersonMovieProps = CardFeedPersonMovieBaseProps &
	(CardFeedPersonMovieSkeletonProps | CardFeedPersonMovieDataProps);

const CardFeedPersonMovieDefault = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	FixedOmit<CardFeedPersonMovieProps, "variant" | "onPress">
>(({ style, children, data, onLongPress, skeleton, ...props }, ref) => {
	const { colors } = useTheme();
	const t = useTranslations();
	const router = useRouter();
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
				source={{ uri: getTmdbImage({ path: data.media.posterPath, size: 'w342' }) ?? '' }}
				alt={data.media.title ?? ''}
				type={'movie'}
				style={[tw`w-20 h-full`, { backgroundColor: colors.background }]}
				/>
			) : (
				<Skeleton style={tw`w-20 h-full`} />
			)}
			<View style={tw`flex-1 gap-2 p-2`}>
				<View style={tw`flex-row items-center gap-1`}>
					{!skeleton ? (
						<Pressable onPress={() => router.push({ pathname: '/person/[person_id]', params: { person_id: data.person.id } })}>
							<UserAvatar avatar_url={getTmdbImage({ path: data.person.profilePath, size: 'w342' }) ?? ''} full_name={data.person.name ?? ''} style={tw`rounded-md`}/>
						</Pressable>
					) : <Skeleton style={tw`w-6 h-6 rounded-md`} />}
					{!skeleton ? (
						<Text textColor="muted">
							{t.rich('pages.feed.cast_and_crew.label', {
								name: data.person.name || t('common.messages.unknown'),
								roles: data.jobs.length ? data.jobs.join(', ').toLowerCase() : t('common.messages.unknown'),
								linkPerson: (chunk) => <Link href={{ pathname: '/person/[person_id]', params: { person_id: data.person.id } }} style={{ color: colors.foreground }}>{chunk}</Link>,
								important: (chunk) => <Text textColor="default">{chunk}</Text>
							})}
						</Text>
					) : <Skeleton style={tw`w-40 h-4`} />}
				</View>
				<View style={tw`gap-2`}>
					{!skeleton ? (
						<Text numberOfLines={2} style={tw`font-bold`}>
						{data.media.title}
						</Text>
 					) : <Skeleton style={tw`w-full h-5`} />}
					{!skeleton ? <BadgeMedia type={'movie'} /> : <Skeleton style={tw`w-20 h-5 rounded-full`} />}
					{!skeleton ? (
						<Text
						textColor={!data.media.overview ? "muted" : undefined}
						numberOfLines={2}
						style={tw`text-xs text-justify`}
						>
							{data.media.overview || upperFirst(t('common.messages.no_description'))}
						</Text>
					) : <Skeleton style={tw`w-full h-12`} />}
				</View>
			</View>
		</Animated.View>
	);
});
CardFeedPersonMovieDefault.displayName = "CardFeedPersonMovieDefault";

const CardFeedPersonMovie = React.forwardRef<
	React.ComponentRef<typeof Animated.View>,
	CardFeedPersonMovieProps
>(({ variant = "default", onPress, onLongPress, ...props }, ref) => {
	const router = useRouter();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const handleOnPress = React.useCallback(() => {
		if (!props.data?.media) return;
		router.push({
			pathname: '/film/[film_id]',
			params: {
				film_id: props.data.media.id,
			}
		});
		onPress?.();
	}, [onPress, props.data?.media, router]);
	const handleOnLongPress = React.useCallback(() => {
		if (!props.data?.media) return;
		openSheet(BottomSheetMovie, {
			movie: props.data.media
		})
		onLongPress?.();
	}, [onLongPress, openSheet, props.data?.media]);
	const content = (
		variant === "default" ? (
			<CardFeedPersonMovieDefault ref={ref} onLongPress={onLongPress} {...props} />
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
CardFeedPersonMovie.displayName = "CardFeedPersonMovie";

export {
	CardFeedPersonMovie,
	CardFeedPersonMovieDefault,
}