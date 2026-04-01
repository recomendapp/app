import { useUIBackgroundsQuery } from "apps/mobile/src/api/ui/uiQueries";
import { useUserFeedCastCrewQuery } from "apps/mobile/src/api/users/userQueries";
import { CardFeedCastCrewMovie } from "apps/mobile/src/components/cards/feed/CardFeedCastCrewMovie";
import { CardFeedCastCrewTvSeries } from "apps/mobile/src/components/cards/feed/CardFeedCastCrewTvSeries";
import { Button } from "apps/mobile/src/components/ui/Button";
import { LoopCarousel } from "apps/mobile/src/components/ui/LoopCarousel";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import app from "apps/mobile/src/constants/app";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { BORDER_RADIUS, GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { LegendList } from "@legendapp/list";
import { Database } from "@recomendapp/types";
import Color from "color";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { upperFirst } from "lodash";
import { useCallback, useMemo } from "react";
import { useTranslations } from "use-intl";

const CastCrewFeedScreen = () => {
	const t = useTranslations();
	const router = useRouter();
	const { bottomOffset, tabBarHeight, colors } = useTheme();
	const { session, customerInfo } = useAuth();
	const {
		data: backgrounds,
	} = useUIBackgroundsQuery();
	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useUserFeedCastCrewQuery();
	const loading = isLoading || data === undefined;
	const feed = useMemo(() => data?.pages.flat().filter(item => item.media !== null) || [], [data]);
	// Render
	const renderItem = useCallback(({ item } : { item: Database['public']['Functions']['get_feed_cast_crew']['Returns'][number], index: number }) => {
		switch (item.media_type) {
			case 'movie':
				return <CardFeedCastCrewMovie movie={item.media} person={item.person} jobs={item.jobs} />;
			case 'tv_series':
				return <CardFeedCastCrewTvSeries tvSeries={item.media} person={item.person} jobs={item.jobs} />;
			default:
				return <View style={[{ backgroundColor: colors.muted}, { borderRadius: BORDER_RADIUS, paddingVertical: PADDING_VERTICAL, paddingHorizontal: PADDING_HORIZONTAL }]}><Text textColor="muted" style={tw`text-center`}>Unsupported media type</Text></View>;
		};
	}, [colors.muted]);
	const renderEmpty = useCallback(() => (
		loading ? <Icons.Loader />
		: (
			<Text style={tw`text-center`} textColor='muted'>
				{upperFirst(t('common.messages.no_results'))}
			</Text>
		)
	), [loading, t]);
	const keyExtractor = useCallback((item: Database['public']['Functions']['get_feed_cast_crew']['Returns'][number], index: number) => (
		`${item.media.id}:${item.media_type}-${item.person.id}`
	), []);
	const onEndReached = useCallback(() => {
		if (hasNextPage) {
			fetchNextPage();
		}
	}, [hasNextPage, fetchNextPage]);

	if (session === undefined || customerInfo === undefined) {
		return (
			<View style={[tw`flex-1 items-center justify-center`, { paddingTop: PADDING_VERTICAL, paddingBottom: bottomOffset + PADDING_VERTICAL }]}>
				<Icons.Loader />
			</View>
		)
	}
	if (!customerInfo?.entitlements.active['premium']) {
		return (
			<View style={[tw`flex-1 items-center justify-center`, { paddingTop: PADDING_VERTICAL, paddingBottom: bottomOffset + PADDING_VERTICAL }]}>
				{backgrounds && (
					<View style={tw`relative absolute inset-0`}>
						<LoopCarousel
						items={backgrounds}
						containerStyle={tw`flex-1`}
						renderItem={(item) => (
							<Image source={item.localUri} contentFit="cover" style={tw`absolute inset-0`} />
						)}
						/>
						<LinearGradient
						colors={[Color(colors.background).hex(), 'transparent']}
						style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
						/>
						<LinearGradient
						colors={['transparent', Color(colors.background).hex()]}
						style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%' }}
						/>
					</View>
				)}
				<Button
				icon={Icons.premium}
				iconProps={{
					color: colors.accentBlue
				}}
				onPress={() => router.push({
					pathname: '/upgrade',
					params: {
						feature: app.features.feed_cast_crew,
					}
				})}
				>
					{upperFirst(t('common.messages.upgrade_to_plan', { plan: 'Premium' }))}
				</Button>
			</View>
		)
	}
	return (
	<>
		<LegendList
		data={feed}
		renderItem={renderItem}
		ListEmptyComponent={renderEmpty}
		contentContainerStyle={{
			paddingHorizontal: PADDING_HORIZONTAL,
			paddingBottom: bottomOffset + PADDING_VERTICAL,
			gap: GAP,
		}}
		scrollIndicatorInsets={{
			bottom: tabBarHeight,
		}}
		keyExtractor={keyExtractor}
		onEndReached={onEndReached}
		onEndReachedThreshold={0.3}
		nestedScrollEnabled
		onRefresh={refetch}
		/>
	</>
	);
};

export default CastCrewFeedScreen;