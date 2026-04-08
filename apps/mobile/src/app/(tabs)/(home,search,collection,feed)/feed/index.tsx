import tw from "apps/mobile/src/lib/tw";
import { upperFirst } from "lodash";
import { LegendList, LegendListRef } from "@legendapp/list/react-native";
import { View } from "apps/mobile/src/components/ui/view";
import { Text } from "apps/mobile/src/components/ui/text";
import { useTranslations } from "use-intl";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { CardFeedLogMovie } from "apps/mobile/src/components/cards/feed/CardFeedLogMovie";
import { CardFeedPlaylistLike } from "apps/mobile/src/components/cards/feed/CardFeedPlaylistLike";
import { CardFeedReviewMovieLike } from "apps/mobile/src/components/cards/feed/CardFeedReviewMovieLike";
import { CardFeedReviewTvSeriesLike } from "apps/mobile/src/components/cards/feed/CardFeedReviewTvSeriesLike";
import { useScrollToTop } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userFeedInfiniteOptions } from "@libs/query-client";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { FeedItem } from "@libs/api-js";
import { CardFeedLogTvSeries } from "apps/mobile/src/components/cards/feed/CardFeedLogTvSeries";

const FeedScreen = () => {
	const t = useTranslations();
	const { user } = useAuth();
	const { bottomOffset, tabBarHeight, colors } = useTheme();
	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useInfiniteQuery(userFeedInfiniteOptions({
		userId: user?.id
	}));
	const loading = isLoading || data === undefined;
	const feed = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);
	// REFs
	const scrollRef = useRef<LegendListRef>(null);
	useScrollToTop(scrollRef);

	// Render 
	const renderItem = useCallback(({ item } : { item: FeedItem, index: number }) => {
		switch (item.activityType) {
			case 'log_movie':
				return <CardFeedLogMovie data={item} />;
			case 'log_tv_series':
				return <CardFeedLogTvSeries data={item} />;
			case 'playlist_like':
				return <CardFeedPlaylistLike data={item} />;
			case 'review_movie_like':
				return <CardFeedReviewMovieLike data={item} />;
			case 'review_tv_series_like':
				return <CardFeedReviewTvSeriesLike data={item} />;
			default:
				return <View style={[{ backgroundColor: colors.muted}, tw`p-4 rounded-md`]}><Text textColor="muted" style={tw`text-center`}>Unsupported activity type</Text></View>;
		}
	}, [colors.muted]);
	const renderEmpty = useCallback(() => (
		loading ? <Icons.Loader />
		: (
			<Text style={tw`text-center`} textColor='muted'>{upperFirst(t('common.messages.no_activity'))}</Text>
		)
	), [t, loading]);

	return (
		<LegendList
		ref={scrollRef}
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
		keyExtractor={(item) => item.id.toString()}
		onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
		onEndReachedThreshold={0.3}
		nestedScrollEnabled
		onRefresh={refetch}
		/>
	);
};

export default FeedScreen;