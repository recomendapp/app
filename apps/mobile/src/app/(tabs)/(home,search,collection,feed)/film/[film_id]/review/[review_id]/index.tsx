import { Button } from "apps/mobile/src/components/ui/Button";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { upperFirst } from "lodash";
import { RefreshControl, ScrollView, View } from "react-native"
import { useTranslations } from "use-intl";
import { Text } from "apps/mobile/src/components/ui/text";
import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import ButtonUserReviewMovieLike from "apps/mobile/src/components/buttons/ButtonUserReviewMovieLike";
import { CardMovie } from "apps/mobile/src/components/cards/CardMovie";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { BottomSheetReviewMovie } from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetReviewMovie";
import { EnrichedTextInput } from "apps/mobile/src/components/RichText/EnrichedTextInput";
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { useUserReviewMovieLike } from "apps/mobile/src/api/users/hooks/useUserReviewMovieLike";
import { useUserReviewMovieQuery } from "apps/mobile/src/api/users/userQueries";
import { NativeStackHeaderItem } from "@react-navigation/native-stack";

const ReviewMovieScreen = () => {
	const { session } = useAuth();
	const { bottomOffset, tabBarHeight, colors } = useTheme();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const t = useTranslations();
	const { review_id } = useLocalSearchParams();
	const reviewId = Number(review_id);
	const {
		data: review,
		isRefetching,
		refetch
	} = useUserReviewMovieQuery({
		reviewId,
	});
	const { isLiked, toggle } = useUserReviewMovieLike({
		reviewId,
	});

	if (review === null) {
		return (
			<Redirect href={{ pathname: '/+not-found', params: { }}} />
		)
	}

	return (
	<>
		<Stack.Screen
		options={{
			headerRight: () => (
			<>
				{review && session && <ButtonUserReviewMovieLike variant="ghost" reviewId={review?.id} />}
				<Button
				variant="ghost"
				size="icon"
				icon={Icons.EllipsisVertical}
				onPress={() => {
					if (review) {
						openSheet(BottomSheetReviewMovie, {
							review: review,
						})
					}
				}}
				/>
			</>
			),
			unstable_headerRightItems: (props) => [
				...(session ? [
					{
						type: "button",
						label: upperFirst(t('common.messages.like')),
						onPress: toggle,
						icon: {
							name: isLiked ? "heart.fill" : "heart",
							type: "sfSymbol",
						},
						tintColor: isLiked ? colors.accentPink : undefined,
					},
				] satisfies NativeStackHeaderItem[] : []),
				{
					type: "button",
					label: upperFirst(t('common.messages.menu')),
					onPress: () => {
						if (review) {
							openSheet(BottomSheetReviewMovie, {
								review: review,
							})
						}
					},
					icon: {
						name: "ellipsis",
						type: "sfSymbol",
					},
				}
			]
		}}
		/>
		{review ? (
			<ScrollView
			contentContainerStyle={{
				paddingBottom: bottomOffset + PADDING_VERTICAL,
				paddingHorizontal: PADDING_HORIZONTAL,
				gap: GAP,
			}}
			scrollIndicatorInsets={{
				bottom: tabBarHeight,
			}}
			refreshControl={
				<RefreshControl
				refreshing={isRefetching}
				onRefresh={refetch}
				/>
			}
			>
				<View style={tw`justify-center items-center`}>
					<Text variant="heading" style={[{ color: colors.accentYellow }, tw`text-center my-2`]}>
						{review.title || upperFirst(t('common.messages.review_by', { name: review.activity?.user?.username! })) }
					</Text>
					<CardUser variant="inline" user={review.activity?.user!} />
				</View>
				<CardMovie
				movie={review.activity?.movie!}
				activity={review.activity!}
				showRating
				/>
				<EnrichedTextInput defaultValue={review.body} editable={false} style={tw`flex-1`} scrollEnabled={false} />
			</ScrollView>
		) : (
			<View style={tw`flex-1 items-center justify-center`}>
				<Icons.Loader />
			</View>
		)}
	</>
	)
};

export default ReviewMovieScreen;