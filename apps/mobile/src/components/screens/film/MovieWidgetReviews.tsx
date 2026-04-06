import tw from "apps/mobile/src/lib/tw";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { LegendList } from "@legendapp/list";
import { upperFirst } from "lodash";
import { Href, Link } from "expo-router";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTranslations } from "use-intl";
import { Text } from "apps/mobile/src/components/ui/text";
import { CardReviewMovie } from "apps/mobile/src/components/cards/reviews/CardReviewMovie";
import { useInfiniteQuery } from "@tanstack/react-query";
import { movieReviewsInfiniteOptions } from "@libs/query-client";
import { Movie, ReviewMovieWithAuthor } from "@packages/api-js";

interface MovieWidgetReviewsProps extends React.ComponentPropsWithoutRef<typeof View> {
	movie: Movie;
	url: Href;
	labelStyle?: StyleProp<TextStyle>;
	containerStyle?: StyleProp<ViewStyle>;
}

const MovieWidgetReviews = ({
	movie,
	url,
	style,
	labelStyle,
	containerStyle,
} : MovieWidgetReviewsProps) => {
	const { colors } = useTheme();
	const t = useTranslations();
	const urlReviews = `${url}/reviews` as Href;
	const {
		data: reviews,
		isLoading,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(movieReviewsInfiniteOptions({
		movieId: movie.id,
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
		<LegendList<ReviewMovieWithAuthor>
		key={loading ? 'loading' : 'reviews'}
		data={loading ? new Array(3).fill(null) : flattenedReviews}
		renderItem={({ item: { rating, author, ...review } }) => (
			<CardReviewMovie
			{...(!loading ? {
				review: review,
				author: author,
				rating: rating,
				url: { pathname: '/user/[username]/film/[film_id]', params: { username: author.username, film_id: review.movieId } }
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

export default MovieWidgetReviews;
