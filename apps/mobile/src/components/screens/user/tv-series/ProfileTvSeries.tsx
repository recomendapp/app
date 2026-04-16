import { userByUsernameOptions, userTvSeriesLogOptions, useUserReviewTvSeriesLike } from "@libs/query-client";
import { useQuery } from "@tanstack/react-query";
import AnimatedContentContainer from "apps/mobile/src/components/ui/AnimatedContentContainer";
import AnimatedStackScreen from "apps/mobile/src/components/ui/AnimatedStackScreen";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import Animated, { FadeIn, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ProfileTvSeriesHeader } from "./ProfileTvSeriesHeader";
import { View } from "../../../ui/view";
import tw from "apps/mobile/src/lib/tw";
import { Text } from "../../../ui/text";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { EnrichedTextInput } from "../../../RichText/EnrichedTextInput";
import { Button } from "../../../ui/Button";
import { Icons } from "apps/mobile/src/constants/Icons";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { NativeStackHeaderItem } from "@react-navigation/native-stack";
import ButtonUserReviewTvSeriesLike from "../../../buttons/ButtonUserReviewTvSeriesLike";
import { BottomSheetLogTvSeries } from "../../../bottom-sheets/sheets/BottomSheetLogTvSeries";

export const ProfileTvSeries = ({
    username,
    tvSeriesId,
}: {
    username: string;
    tvSeriesId: number;
}) => {
    const { user } = useAuth();
    const { colors, bottomOffset, tabBarHeight } = useTheme();
    const t = useTranslations();
    const openSheet = useBottomSheetStore((state) => state.openSheet);
    // Queries
    const { data: profile } = useQuery(userByUsernameOptions({
        username: username,
    }));
    const {
        data: log,
        isLoading,
    } = useQuery(userTvSeriesLogOptions({
        userId: profile?.id,
        tvSeriesId,
    }));
    const { isLiked, toggle } = useUserReviewTvSeriesLike({
        userId: user?.id,
		reviewId: log?.review?.id,
	});

    // SharedValue
    const headerHeight = useSharedValue<number>(0);
    const scrollY = useSharedValue<number>(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: event => {
            scrollY.value = event.contentOffset.y;
        },
    });
    const animatedContentContainerStyle = useAnimatedStyle(() => {
        return {
            paddingBottom: withTiming(
                bottomOffset + (PADDING_VERTICAL * 2),
                { duration: 300 }
            ),
        };
    });
    return (
    <>
        <AnimatedStackScreen
        options={{
            headerTitle: log?.tvSeries.name || '',
            headerTransparent: true,
            headerRight: () => (
			<>
				{log?.review && <ButtonUserReviewTvSeriesLike variant="ghost" reviewId={log.review.id} />}
				<Button
				variant="ghost"
				size="icon"
				icon={Icons.EllipsisVertical}
				onPress={() => {
					if (log) {
						openSheet(BottomSheetLogTvSeries, {
							log: log,
                            profile: log.user,
						})
					}
				}}
				/>
			</>
			),
			unstable_headerRightItems: (props) => [
				...(log?.review ? [
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
						if (log) {
                            openSheet(BottomSheetLogTvSeries, {
                                log: log,
                                profile: log.user,
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
        scrollY={scrollY}
        triggerHeight={headerHeight}
        />
        <AnimatedContentContainer
        onScroll={scrollHandler}
        scrollToOverflowEnabled
        contentContainerStyle={animatedContentContainerStyle}
        scrollIndicatorInsets={{
            bottom: tabBarHeight,
        }}
        >
            <ProfileTvSeriesHeader
            log={log}
            loading={isLoading}
            scrollY={scrollY}
            triggerHeight={headerHeight}
            />
            {log?.review && (
                <Animated.View entering={FadeIn} style={{ paddingHorizontal: PADDING_HORIZONTAL }}>
                    <View style={tw`justify-center items-center`}>
         				<Text variant="heading" style={[{ color: colors.accentYellow }, tw`text-center my-2`]}>
         					{log.review.title || upperFirst(t('common.messages.review_by', { name: log.user.username })) }
         				</Text>
                    </View>
                    <EnrichedTextInput key={log.review.body} defaultValue={log.review.body} editable={false} style={tw`flex-1`} scrollEnabled={false} />
                </Animated.View>
            )}
        </AnimatedContentContainer>
    </>
    );
};
