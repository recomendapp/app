import tw from "apps/mobile/src/lib/tw";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { LegendList } from "@legendapp/list";
import { upperFirst } from "lodash";
import { Href, Link } from "expo-router";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTranslations } from "use-intl";
import { Text } from "apps/mobile/src/components/ui/text";
import { CardReviewTvSeries } from "apps/mobile/src/components/cards/reviews/CardReviewTvSeries";
import { ReviewTvSeriesWithAuthor, TvSeries } from "@packages/api-js";
import { useInfiniteQuery } from "@tanstack/react-query";
import { tvSeriesReviewsInfiniteOptions } from "@libs/query-client";

interface TvSeriesWidgetReviewsProps extends React.ComponentPropsWithoutRef<typeof View> {
	tvSeries: TvSeries;
	url: Href;
	labelStyle?: StyleProp<TextStyle>;
	containerStyle?: StyleProp<ViewStyle>;
}

const TvSeriesWidgetReviews = ({
	tvSeries,
	url,
	style,
	labelStyle,
	containerStyle,
} : TvSeriesWidgetReviewsProps) => {
	const { colors } = useTheme();
	const t = useTranslations();
	const urlReviews = `${url}/reviews` as Href;
	const {
		data: reviews,
		isLoading,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(tvSeriesReviewsInfiniteOptions({
		tvSeriesId: tvSeries.id,
	}));
	const flattenedReviews = reviews?.pages.flatMap(page => page.data) || [];
	const loading = reviews === undefined || isLoading;

	return (
	<View style={[tw`gap-1`, style]}>
		<Link href={urlReviews} style={labelStyle}>
			<View style={tw`flex-row items-center`}>
				<Text style={tw`font-medium text-lg`} numberOfLines={1}>
					{upperFirst(t('common.messages.review', { count: 2 }))}
				</Text>
				<Icons.ChevronRight color={colors.mutedForeground} />
			</View>
		</Link>
		<LegendList<ReviewTvSeriesWithAuthor>
		key={loading ? 'loading' : 'reviews'}
		data={loading ? new Array(3).fill(null) : flattenedReviews}
		renderItem={({ item: { rating, author, ...review } }) => (
			<CardReviewTvSeries
			{...(!loading ? {
				review: review,
				author: author,
				rating: rating,
				url: { pathname: '/user/[username]/tv-series/[tv_series_id]', params: { username: author.username, tv_series_id: review.tvSeriesId } }
			} : { skeleton: true })}
			style={tw`w-86`}
			/>
		)}
		ListEmptyComponent={
			<Text style={[tw``, { color: colors.mutedForeground }]}>
				{upperFirst(t('common.messages.no_reviews'))}
			</Text>
		}
		snapToInterval={352}
		decelerationRate="fast"
		keyExtractor={(item, index) => loading ? index.toString() : item.id.toString()}
		horizontal
		showsHorizontalScrollIndicator={false}
		ItemSeparatorComponent={() => <View style={tw`w-2`} />}
		contentContainerStyle={containerStyle}
		nestedScrollEnabled
		onEndReached={() => hasNextPage && fetchNextPage()}
		onEndReachedThreshold={0.5}
		/>
	</View>
	);
};

export default TvSeriesWidgetReviews;
